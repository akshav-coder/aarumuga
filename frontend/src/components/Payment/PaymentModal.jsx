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
import Modal from "../common/Modal";
import {
  useRecordPaymentMutation,
  useGetOutstandingPaymentsQuery,
} from "../../store/api/paymentApi";
import { useGetCustomersQuery } from "../../store/api/customerApi";
import { useToast } from "../common/ToastProvider";
import { useTranslation } from "../../hooks/useTranslation";
import {
  formatIndianCurrency,
  formatIndianNumber,
  parseFormattedNumber,
} from "../../utils/numberFormat";
import dayjs from "dayjs";
import PaymentIcon from "@mui/icons-material/Payment";

function PaymentModal({ open, onClose, sale, onSuccess }) {
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSales, setSelectedSales] = useState({}); // { saleId: { amount: "", checked: true } }
  const [bulkMode, setBulkMode] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: dayjs().format("YYYY-MM-DD"),
    paymentMethod: "cash",
    notes: "",
  });

  const { showToast } = useToast();
  const [recordPayment] = useRecordPaymentMutation();
  const { data: customersData } = useGetCustomersQuery({ limit: 1000 });
  const { data: outstandingData, refetch: refetchOutstanding } =
    useGetOutstandingPaymentsQuery(selectedCustomer || "", {
      skip: !selectedCustomer,
    });

  const customers = customersData?.customers || [];
  const outstandingSales = outstandingData?.sales || [];

  useEffect(() => {
    if (sale) {
      // If sale is provided, pre-fill customer and sale
      setSelectedCustomer(sale.customer);
      setSelectedSale(sale._id);
      setBulkMode(false);
      setSelectedSales({});
      setFormData({
        amount: sale.outstandingAmount
          ? formatIndianNumber(sale.outstandingAmount)
          : "",
        paymentDate: dayjs().format("YYYY-MM-DD"),
        paymentMethod: "cash",
        notes: "",
      });
    } else {
      // Reset form
      setSelectedCustomer("");
      setSelectedSale(null);
      setBulkMode(false);
      setSelectedSales({});
      setFormData({
        amount: "",
        paymentDate: dayjs().format("YYYY-MM-DD"),
        paymentMethod: "cash",
        notes: "",
      });
    }
  }, [sale, open]);

  useEffect(() => {
    // Refetch outstanding when customer changes
    if (selectedCustomer) {
      refetchOutstanding();
    }
  }, [selectedCustomer, refetchOutstanding]);

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

  const handleSaleSelect = (saleId) => {
    if (bulkMode) {
      // Toggle selection in bulk mode
      setSelectedSales((prev) => {
        const sale = outstandingSales.find((s) => s._id === saleId);
        const maxAmount = sale?.outstandingAmount || sale?.total || 0;
        const isChecked = prev[saleId]?.checked || false;
        if (isChecked) {
          const { [saleId]: removed, ...rest } = prev;
          return rest;
        } else {
          return {
            ...prev,
            [saleId]: {
              checked: true,
              amount: formatIndianNumber(maxAmount),
            },
          };
        }
      });
    } else {
      // Single selection mode
      setSelectedSale(saleId);
      const sale = outstandingSales.find((s) => s._id === saleId);
      if (sale) {
        const maxAmount = sale.outstandingAmount || sale.total;
        setFormData((prev) => ({
          ...prev,
          amount: formatIndianNumber(maxAmount),
        }));
      }
    }
  };

  const handleBulkAmountChange = (saleId, value) => {
    const parsed = parseFormattedNumber(value);
    if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
      const formatted = parsed ? formatIndianNumber(parsed) : "";
      setSelectedSales((prev) => ({
        ...prev,
        [saleId]: {
          ...prev[saleId],
          amount: formatted,
        },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      showToast(t("pleaseSelectCustomer"), "error");
      return;
    }

    if (bulkMode) {
      // Bulk payment mode
      const selectedSaleIds = Object.keys(selectedSales).filter(
        (id) => selectedSales[id]?.checked
      );
      if (selectedSaleIds.length === 0) {
        showToast(t("pleaseSelectAtLeastOneSale"), "error");
        return;
      }

      // Validate all amounts
      for (const saleId of selectedSaleIds) {
        const saleData = outstandingSales.find((s) => s._id === saleId);
        if (!saleData) {
          showToast(t("saleNotFound"), "error");
          return;
        }

        const amount = parseFloat(
          parseFormattedNumber(selectedSales[saleId].amount || "0")
        );
        if (!amount || amount <= 0) {
          showToast(
            `${t("amountMustBeGreaterThanZero")} - ${dayjs(
              saleData.date
            ).format("DD/MM/YYYY")}`,
            "error"
          );
          return;
        }

        const maxAmount = saleData.outstandingAmount || saleData.total;
        if (amount > maxAmount) {
          showToast(
            `${t("amountExceedsOutstanding")} - ${dayjs(saleData.date).format(
              "DD/MM/YYYY"
            )}: ${formatIndianCurrency(maxAmount)}`,
            "error"
          );
          return;
        }
      }

      // Record all payments
      try {
        const paymentPromises = selectedSaleIds.map((saleId) => {
          const amount = parseFloat(
            parseFormattedNumber(selectedSales[saleId].amount)
          );
          return recordPayment({
            saleId: saleId,
            amount: amount,
            paymentDate: formData.paymentDate,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes,
          }).unwrap();
        });

        await Promise.all(paymentPromises);
        showToast(
          `${t("paymentsRecorded")} (${selectedSaleIds.length} ${t(
            "payments"
          )})`,
          "success"
        );
        onSuccess();
        onClose();
      } catch (error) {
        showToast(error.data?.message || t("failedToSave"), "error");
      }
    } else {
      // Single payment mode
      if (!selectedSale) {
        showToast(t("pleaseSelectSale"), "error");
        return;
      }

      const amount = parseFloat(parseFormattedNumber(formData.amount));
      if (!amount || amount <= 0) {
        showToast(t("amountMustBeGreaterThanZero"), "error");
        return;
      }

      const selectedSaleData = outstandingSales.find(
        (s) => s._id === selectedSale
      );
      if (!selectedSaleData) {
        showToast(t("saleNotFound"), "error");
        return;
      }

      const maxAmount =
        selectedSaleData.outstandingAmount || selectedSaleData.total;
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
        await recordPayment({
          saleId: selectedSale,
          amount: amount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }).unwrap();

        showToast(t("paymentRecorded"), "success");
        onSuccess();
        onClose();
      } catch (error) {
        showToast(error.data?.message || t("failedToSave"), "error");
      }
    }
  };

  const customerOutstanding = outstandingData?.customerWise?.find(
    (c) => c.customer === selectedCustomer
  );

  // Calculate total payment for bulk mode
  const selectedSaleIds = Object.keys(selectedSales).filter(
    (id) => selectedSales[id]?.checked
  );
  const totalPayment = selectedSaleIds.reduce((sum, saleId) => {
    const amount = parseFormattedNumber(selectedSales[saleId]?.amount || "0");
    return sum + parseFloat(amount || 0);
  }, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("recordPayment")}
      onSubmit={handleSubmit}
      submitText={t("recordPayment")}
      maxWidth="md"
    >
      <Box sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>{t("customer")}</InputLabel>
              <Select
                value={selectedCustomer}
                label={t("customer")}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  setSelectedSale(null);
                  setFormData((prev) => ({ ...prev, amount: "" }));
                }}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer.name}>
                    {customer.name} {customer.city && `- ${customer.city}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedCustomer && customerOutstanding && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("totalOutstanding")}:{" "}
                  {formatIndianCurrency(customerOutstanding.totalOutstanding)}
                </Typography>
              </Alert>
            </Grid>
          )}

          {selectedCustomer && outstandingSales.length > 0 && (
            <Grid item xs={12}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">{t("outstandingSales")}</Typography>
                <Button
                  variant={bulkMode ? "contained" : "outlined"}
                  size="small"
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    setSelectedSale(null);
                    setSelectedSales({});
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
                    {outstandingSales.map((sale) => {
                      const isSelected =
                        bulkMode && selectedSales[sale._id]?.checked;
                      const isSingleSelected =
                        !bulkMode && selectedSale === sale._id;
                      return (
                        <TableRow
                          key={sale._id}
                          sx={{
                            bgcolor:
                              isSelected || isSingleSelected
                                ? "action.selected"
                                : "transparent",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                          onClick={() =>
                            !bulkMode && handleSaleSelect(sale._id)
                          }
                        >
                          {bulkMode && (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected || false}
                                onChange={() => handleSaleSelect(sale._id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            {dayjs(sale.date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell>
                            {formatIndianCurrency(sale.total)}
                          </TableCell>
                          <TableCell>
                            {formatIndianCurrency(sale.paidAmount || 0)}
                          </TableCell>
                          <TableCell>
                            {formatIndianCurrency(
                              sale.outstandingAmount || sale.total
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(sale.paymentStatus || "unpaid")}
                              size="small"
                              color={
                                sale.paymentStatus === "paid"
                                  ? "success"
                                  : sale.paymentStatus === "partial"
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
                                  value={selectedSales[sale._id]?.amount || ""}
                                  onChange={(e) =>
                                    handleBulkAmountChange(
                                      sale._id,
                                      e.target.value
                                    )
                                  }
                                  placeholder={formatIndianCurrency(
                                    sale.outstandingAmount || sale.total
                                  )}
                                  helperText={`Max: ${formatIndianCurrency(
                                    sale.outstandingAmount || sale.total
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

          {selectedCustomer && outstandingSales.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="success">{t("noOutstandingPayments")}</Alert>
            </Grid>
          )}

          {((!bulkMode && selectedSale) ||
            (bulkMode &&
              Object.keys(selectedSales).filter(
                (id) => selectedSales[id]?.checked
              ).length > 0)) && (
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
                      selectedSale
                        ? `${t("maxOutstanding")}: ${formatIndianCurrency(
                            outstandingSales.find((s) => s._id === selectedSale)
                              ?.outstandingAmount ||
                              outstandingSales.find(
                                (s) => s._id === selectedSale
                              )?.total ||
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
                            {t("selectedBills")}: {selectedSaleIds.length}
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
            </>
          )}
        </Grid>
      </Box>
    </Modal>
  );
}

export default PaymentModal;
