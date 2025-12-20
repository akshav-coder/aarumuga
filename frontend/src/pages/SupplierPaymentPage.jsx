import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useGetSuppliersQuery } from "../store/api/supplierApi";
import {
  useGetSupplierOutstandingPurchasesQuery,
  useRecordSupplierPaymentMutation,
} from "../store/api/supplierPaymentApi";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";

function SupplierPaymentPage() {
  const { t } = useTranslation();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [paymentDate, setPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [paymentAmount, setPaymentAmount] = useState("");
  const [allocations, setAllocations] = useState({});
  const [supplierSearch, setSupplierSearch] = useState("");

  const { showToast } = useToast();
  const { data: suppliersData, isLoading: suppliersLoading } =
    useGetSuppliersQuery({
      page: 1,
      limit: 1000,
      search: supplierSearch,
    });

  const {
    data: outstandingData,
    isLoading: outstandingLoading,
    refetch: refetchOutstanding,
  } = useGetSupplierOutstandingPurchasesQuery(selectedSupplier?._id, {
    skip: !selectedSupplier,
  });

  const [recordPayment, { isLoading: saving }] =
    useRecordSupplierPaymentMutation();

  // Auto-allocate payment when amount changes
  useEffect(() => {
    if (
      selectedSupplier &&
      outstandingData?.purchases &&
      paymentAmount &&
      parseFloat(paymentAmount) > 0
    ) {
      const amount = parseFloat(paymentAmount);
      const newAllocations = {};
      let remaining = amount;

      // Sort purchases by date (oldest first)
      const sortedPurchases = [...outstandingData.purchases].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      for (const purchase of sortedPurchases) {
        if (remaining <= 0) break;

        const outstanding = purchase.outstandingAmount;
        const allocated = Math.min(outstanding, remaining);

        if (allocated > 0) {
          newAllocations[purchase._id] = allocated;
          remaining -= allocated;
        }
      }

      setAllocations(newAllocations);
    } else {
      setAllocations({});
    }
  }, [paymentAmount, outstandingData, selectedSupplier]);

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setPaymentAmount("");
    setAllocations({});
  };

  const handleAmountChange = (purchaseId, value) => {
    const numValue = parseFloat(value) || 0;
    const purchase = outstandingData?.purchases.find(
      (p) => p._id === purchaseId
    );

    if (!purchase) return;

    const maxAmount = purchase.outstandingAmount;
    const allocated = Math.min(Math.max(0, numValue), maxAmount);

    setAllocations((prev) => {
      const newAllocs = { ...prev };
      if (allocated > 0) {
        newAllocs[purchaseId] = allocated;
      } else {
        delete newAllocs[purchaseId];
      }

      // Recalculate total payment amount
      const total = Object.values(newAllocs).reduce((sum, amt) => sum + amt, 0);
      setPaymentAmount(total.toString());

      return newAllocs;
    });
  };

  const handleSave = async () => {
    if (!selectedSupplier) {
      showToast(t("pleaseSelectSupplier"), "warning");
      return;
    }

    if (!paymentDate) {
      showToast(t("paymentDateRequired"), "warning");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      showToast(t("amountMustBeGreaterThanZero"), "warning");
      return;
    }

    try {
      const allocationArray = Object.entries(allocations).map(
        ([purchaseId, amount]) => ({
          purchaseId,
          amount,
        })
      );

      await recordPayment({
        supplierId: selectedSupplier._id,
        paymentDate,
        paymentAmount: amount,
        allocations: allocationArray.length > 0 ? allocationArray : undefined,
      }).unwrap();

      showToast(t("paymentRecorded"), "success");
      setPaymentAmount("");
      setAllocations({});
      refetchOutstanding();
    } catch (error) {
      showToast(error.data?.message || t("failedToSave"), "error");
    }
  };

  const totalAllocated = Object.values(allocations).reduce(
    (sum, amt) => sum + amt,
    0
  );
  const totalOutstanding = outstandingData?.totalOutstanding || 0;

  const suppliers = suppliersData?.suppliers || [];

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

      <Grid container spacing={3}>
        {/* Payment Form and Invoices */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t("paymentDetails")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={suppliers}
                    getOptionLabel={(option) => option.name || ""}
                    loading={suppliersLoading}
                    value={selectedSupplier}
                    onChange={(event, newValue) => {
                      handleSupplierSelect(newValue);
                    }}
                    onInputChange={(event, newInputValue) => {
                      setSupplierSearch(newInputValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("supplier")}
                        placeholder={t("searchSupplier")}
                        required
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {option.name}
                          </Typography>
                          {option.phone && (
                            <Typography variant="body2" color="text.secondary">
                              {option.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    noOptionsText={t("noDataAvailable")}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t("paymentDate")}
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t("paymentAmount")}
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText={t("payAmountHelper")}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={
                      saving ||
                      !selectedSupplier ||
                      !paymentAmount ||
                      parseFloat(paymentAmount) <= 0
                    }
                    size="large"
                    sx={{ height: "56px" }}
                  >
                    {saving ? t("loading") : t("save")}
                  </Button>
                </Grid>
                {selectedSupplier && totalOutstanding > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      {t("totalOutstanding")}: ₹
                      {totalOutstanding.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {selectedSupplier ? (
            <>
              {/* Outstanding Invoices */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {t("outstandingPurchases")}
                  </Typography>
                  {outstandingLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress />
                    </Box>
                  ) : outstandingData?.purchases?.length > 0 ? (
                    <>
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{t("date")}</TableCell>
                              <TableCell>{t("invoiceNo")}</TableCell>
                              <TableCell align="right">
                                {t("totalAmount")}
                              </TableCell>
                              <TableCell align="right">
                                {t("paidAmount")}
                              </TableCell>
                              <TableCell align="right">
                                {t("outstandingAmount")}
                              </TableCell>
                              <TableCell align="right">
                                {t("payAmount")}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {outstandingData.purchases.map((purchase) => (
                              <TableRow key={purchase._id}>
                                <TableCell>
                                  {dayjs(purchase.date).format("DD/MM/YYYY")}
                                </TableCell>
                                <TableCell>{purchase.invoiceNo}</TableCell>
                                <TableCell align="right">
                                  ₹{purchase.totalAmount.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                  ₹{purchase.paidAmount.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={`₹${purchase.outstandingAmount.toFixed(
                                      2
                                    )}`}
                                    color={
                                      purchase.paymentStatus === "unpaid"
                                        ? "error"
                                        : "warning"
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={allocations[purchase._id] || ""}
                                    onChange={(e) =>
                                      handleAmountChange(
                                        purchase._id,
                                        e.target.value
                                      )
                                    }
                                    inputProps={{
                                      min: 0,
                                      max: purchase.outstandingAmount,
                                      step: 0.01,
                                    }}
                                    sx={{ width: 100 }}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          ₹
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {t("totalAllocated")}: ₹
                          {totalAllocated.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                        {Math.abs(
                          totalAllocated - parseFloat(paymentAmount || 0)
                        ) > 0.01 && (
                          <Alert severity="warning" sx={{ py: 0.5 }}>
                            {t("distributedAmountMismatch")}
                          </Alert>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Alert severity="info">{t("noOutstandingPurchases")}</Alert>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent>
                <Alert severity="info">{t("selectSupplierToViewBills")}</Alert>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default SupplierPaymentPage;
