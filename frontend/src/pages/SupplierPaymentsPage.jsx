import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  Button,
  Card,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import {
  useRecordSupplierPaymentMutation,
  useGetOutstandingSupplierPaymentsQuery,
} from "../store/api/supplierPaymentApi";
import { useGetSuppliersQuery } from "../store/api/supplierApi";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "../hooks/useTranslation";
import {
  formatIndianCurrency,
  formatIndianNumber,
  parseFormattedNumber,
} from "../utils/numberFormat";
import dayjs from "dayjs";

function SupplierPaymentsPage() {
  const { t } = useTranslation();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedPurchases, setSelectedPurchases] = useState({}); // { purchaseId: { amount: "", checked: true } }
  const [bulkMode, setBulkMode] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: dayjs().format("YYYY-MM-DD"),
    paymentMethod: "cash",
    notes: "",
  });

  const { showToast } = useToast();
  const [recordSupplierPayment] = useRecordSupplierPaymentMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 1000 });
  const { data: outstandingData, refetch: refetchOutstanding } =
    useGetOutstandingSupplierPaymentsQuery(selectedSupplier || "", {
      skip: !selectedSupplier,
    });

  const suppliers = suppliersData?.suppliers || [];
  const outstandingPurchases = outstandingData?.purchases || [];

  useEffect(() => {
    // Refetch outstanding when supplier changes
    if (selectedSupplier) {
      refetchOutstanding();
    }
  }, [selectedSupplier, refetchOutstanding]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      const parsed = parseFormattedNumber(value);
      if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
        const formatted = parsed ? formatIndianNumber(parsed) : "";
        setFormData((prev) => ({ ...prev, [name]: formatted }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePurchaseSelect = (purchaseId) => {
    if (bulkMode) {
      // Toggle selection in bulk mode
      setSelectedPurchases((prev) => {
        const purchase = outstandingPurchases.find((p) => p._id === purchaseId);
        const maxAmount =
          purchase?.outstandingAmount || purchase?.totalAmount || 0;
        const isChecked = prev[purchaseId]?.checked || false;
        if (isChecked) {
          const { [purchaseId]: removed, ...rest } = prev;
          return rest;
        } else {
          return {
            ...prev,
            [purchaseId]: {
              checked: true,
              amount: formatIndianNumber(maxAmount),
            },
          };
        }
      });
    } else {
      // Single selection mode
      setSelectedPurchase(purchaseId);
      const purchase = outstandingPurchases.find((p) => p._id === purchaseId);
      if (purchase) {
        const maxAmount = purchase.outstandingAmount || purchase.totalAmount;
        setFormData((prev) => ({
          ...prev,
          amount: formatIndianNumber(maxAmount),
        }));
      }
    }
  };

  const handleBulkAmountChange = (purchaseId, value) => {
    const parsed = parseFormattedNumber(value);
    if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
      const formatted = parsed ? formatIndianNumber(parsed) : "";
      setSelectedPurchases((prev) => ({
        ...prev,
        [purchaseId]: {
          ...prev[purchaseId],
          amount: formatted,
        },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      showToast(t("pleaseSelectSupplier"), "error");
      return;
    }

    if (bulkMode) {
      // Bulk payment mode
      const selectedPurchaseIds = Object.keys(selectedPurchases).filter(
        (id) => selectedPurchases[id]?.checked
      );
      if (selectedPurchaseIds.length === 0) {
        showToast(t("pleaseSelectAtLeastOnePurchase"), "error");
        return;
      }

      // Validate all amounts
      for (const purchaseId of selectedPurchaseIds) {
        const purchaseData = outstandingPurchases.find(
          (p) => p._id === purchaseId
        );
        if (!purchaseData) {
          showToast(t("purchaseNotFound"), "error");
          return;
        }

        const amount = parseFloat(
          parseFormattedNumber(selectedPurchases[purchaseId].amount || "0")
        );
        if (!amount || amount <= 0) {
          showToast(
            `${t("amountMustBeGreaterThanZero")} - ${dayjs(
              purchaseData.date
            ).format("DD/MM/YYYY")}`,
            "error"
          );
          return;
        }

        const maxAmount =
          purchaseData.outstandingAmount || purchaseData.totalAmount;
        if (amount > maxAmount) {
          showToast(
            `${t("amountExceedsOutstanding")} - ${dayjs(
              purchaseData.date
            ).format("DD/MM/YYYY")}: ${formatIndianCurrency(maxAmount)}`,
            "error"
          );
          return;
        }
      }

      // Record all payments
      try {
        const paymentPromises = selectedPurchaseIds.map((purchaseId) => {
          const amount = parseFloat(
            parseFormattedNumber(selectedPurchases[purchaseId].amount)
          );
          return recordSupplierPayment({
            purchaseId: purchaseId,
            amount: amount,
            paymentDate: formData.paymentDate,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes,
          }).unwrap();
        });

        await Promise.all(paymentPromises);
        showToast(
          `${t("paymentsRecorded")} (${selectedPurchaseIds.length} ${t(
            "payments"
          )})`,
          "success"
        );

        // Reset form
        setSelectedSupplier("");
        setSelectedPurchase(null);
        setSelectedPurchases({});
        setBulkMode(false);
        setFormData({
          amount: "",
          paymentDate: dayjs().format("YYYY-MM-DD"),
          paymentMethod: "cash",
          notes: "",
        });
        refetchOutstanding();
      } catch (error) {
        showToast(error.data?.message || t("failedToSave"), "error");
      }
    } else {
      // Single payment mode
      if (!selectedPurchase) {
        showToast(t("pleaseSelectPurchase"), "error");
        return;
      }

      const amount = parseFloat(parseFormattedNumber(formData.amount));
      if (!amount || amount <= 0) {
        showToast(t("amountMustBeGreaterThanZero"), "error");
        return;
      }

      const selectedPurchaseData = outstandingPurchases.find(
        (p) => p._id === selectedPurchase
      );
      if (!selectedPurchaseData) {
        showToast(t("purchaseNotFound"), "error");
        return;
      }

      const maxAmount =
        selectedPurchaseData.outstandingAmount ||
        selectedPurchaseData.totalAmount;
      if (amount > maxAmount) {
        showToast(
          `${t("amountExceedsOutstanding")}. ${t(
            "outstandingAmount"
          )}: ${formatIndianCurrency(maxAmount)}`,
          "error"
        );
        return;
      }

      try {
        await recordSupplierPayment({
          purchaseId: selectedPurchase,
          amount: amount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }).unwrap();

        showToast(t("paymentRecorded"), "success");

        // Reset form
        setSelectedSupplier("");
        setSelectedPurchase(null);
        setSelectedPurchases({});
        setBulkMode(false);
        setFormData({
          amount: "",
          paymentDate: dayjs().format("YYYY-MM-DD"),
          paymentMethod: "cash",
          notes: "",
        });
        refetchOutstanding();
      } catch (error) {
        showToast(error.data?.message || t("failedToSave"), "error");
      }
    }
  };

  const supplierOutstanding = outstandingData?.supplierWise?.find(
    (s) => s.supplier === selectedSupplier
  );

  // Calculate total payment for bulk mode
  const selectedPurchaseIds = Object.keys(selectedPurchases).filter(
    (id) => selectedPurchases[id]?.checked
  );
  const totalPayment = selectedPurchaseIds.reduce((sum, purchaseId) => {
    const amount = parseFormattedNumber(
      selectedPurchases[purchaseId]?.amount || "0"
    );
    return sum + parseFloat(amount || 0);
  }, 0);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 1, fontSize: "2rem" }}
          >
            {t("supplierPayments")}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: "1.125rem" }}
          >
            {t("supplierPaymentsSubtitle")}
          </Typography>
        </Box>
      </Box>

      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>{t("supplier")}</InputLabel>
              <Select
                value={selectedSupplier}
                label={t("supplier")}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  setSelectedPurchase(null);
                  setSelectedPurchases({});
                  setFormData((prev) => ({ ...prev, amount: "" }));
                }}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier.name}>
                    {supplier.name} {supplier.city && `- ${supplier.city}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedSupplier && supplierOutstanding && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("totalOutstanding")}:{" "}
                  {formatIndianCurrency(supplierOutstanding.totalOutstanding)}
                </Typography>
              </Alert>
            </Grid>
          )}

          {selectedSupplier && outstandingPurchases.length > 0 && (
            <Grid item xs={12}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">
                  {t("outstandingPurchases")}
                </Typography>
                <Button
                  variant={bulkMode ? "contained" : "outlined"}
                  size="small"
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    setSelectedPurchase(null);
                    setSelectedPurchases({});
                    setFormData((prev) => ({ ...prev, amount: "" }));
                  }}
                >
                  {bulkMode ? t("singlePayment") : t("bulkPayment")}
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {bulkMode && <TableCell padding="checkbox"></TableCell>}
                      <TableCell>{t("date")}</TableCell>
                      <TableCell>{t("total")}</TableCell>
                      <TableCell>{t("paidAmount")}</TableCell>
                      <TableCell>{t("outstandingAmount")}</TableCell>
                      <TableCell>{t("paymentStatus")}</TableCell>
                      {bulkMode ? (
                        <TableCell>{t("paymentAmount")}</TableCell>
                      ) : (
                        <TableCell>{t("select")}</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {outstandingPurchases.map((purchase) => {
                      const isSelected =
                        bulkMode && selectedPurchases[purchase._id]?.checked;
                      const isSingleSelected =
                        !bulkMode && selectedPurchase === purchase._id;
                      return (
                        <TableRow
                          key={purchase._id}
                          sx={{
                            bgcolor:
                              isSelected || isSingleSelected
                                ? "action.selected"
                                : "transparent",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                          onClick={() =>
                            !bulkMode && handlePurchaseSelect(purchase._id)
                          }
                        >
                          {bulkMode && (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected || false}
                                onChange={() =>
                                  handlePurchaseSelect(purchase._id)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            {dayjs(purchase.date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell>
                            {formatIndianCurrency(purchase.totalAmount)}
                          </TableCell>
                          <TableCell>
                            {formatIndianCurrency(purchase.paidAmount || 0)}
                          </TableCell>
                          <TableCell>
                            {formatIndianCurrency(
                              purchase.outstandingAmount || purchase.totalAmount
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(purchase.paymentStatus || "unpaid")}
                              size="small"
                              color={
                                purchase.paymentStatus === "paid"
                                  ? "success"
                                  : purchase.paymentStatus === "partial"
                                  ? "warning"
                                  : "error"
                              }
                            />
                          </TableCell>
                          {bulkMode ? (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {isSelected ? (
                                <TextField
                                  size="small"
                                  value={
                                    selectedPurchases[purchase._id]?.amount ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleBulkAmountChange(
                                      purchase._id,
                                      e.target.value
                                    )
                                  }
                                  placeholder={formatIndianCurrency(
                                    purchase.outstandingAmount ||
                                      purchase.totalAmount
                                  )}
                                  helperText={`Max: ${formatIndianCurrency(
                                    purchase.outstandingAmount ||
                                      purchase.totalAmount
                                  )}`}
                                  sx={{ width: 150 }}
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {t("selectToEnterAmount")}
                                </Typography>
                              )}
                            </TableCell>
                          ) : (
                            <TableCell>
                              <Chip
                                label={
                                  isSingleSelected
                                    ? t("selected")
                                    : t("clickToSelect")
                                }
                                size="small"
                                color={isSingleSelected ? "primary" : "default"}
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {selectedSupplier && outstandingPurchases.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="success">{t("noOutstandingPayments")}</Alert>
            </Grid>
          )}

          {((!bulkMode && selectedPurchase) ||
            (bulkMode && selectedPurchaseIds.length > 0)) && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t("paymentDate")}
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t("paymentMethod")}</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    label={t("paymentMethod")}
                    onChange={handleChange}
                    name="paymentMethod"
                  >
                    <MenuItem value="cash">{t("cash")}</MenuItem>
                    <MenuItem value="bank_transfer">
                      {t("bankTransfer")}
                    </MenuItem>
                    <MenuItem value="cheque">{t("cheque")}</MenuItem>
                    <MenuItem value="upi">{t("upi")}</MenuItem>
                    <MenuItem value="other">{t("other")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {!bulkMode && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t("amount")}
                    name="amount"
                    type="text"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    helperText={
                      selectedPurchase
                        ? `${t("maxOutstanding")}: ${formatIndianCurrency(
                            outstandingPurchases.find(
                              (p) => p._id === selectedPurchase
                            )?.outstandingAmount ||
                              outstandingPurchases.find(
                                (p) => p._id === selectedPurchase
                              )?.totalAmount ||
                              0
                          )}`
                        : ""
                    }
                  />
                </Grid>
              )}
              {bulkMode && (
                <>
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        p: 2,
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ opacity: 0.9, mb: 0.5 }}
                          >
                            {t("selectedBills")}: {selectedPurchaseIds.length}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {t("totalPayment")}:{" "}
                            {formatIndianCurrency(totalPayment)}
                          </Typography>
                        </Box>
                        <PaymentIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        {t("bulkPaymentInfo")}
                      </Typography>
                    </Alert>
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t("notes")}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedSupplier("");
                      setSelectedPurchase(null);
                      setSelectedPurchases({});
                      setBulkMode(false);
                      setFormData({
                        amount: "",
                        paymentDate: dayjs().format("YYYY-MM-DD"),
                        paymentMethod: "cash",
                        notes: "",
                      });
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    startIcon={<PaymentIcon />}
                  >
                    {t("recordPayment")}
                  </Button>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Card>
    </Box>
  );
}

export default SupplierPaymentsPage;

