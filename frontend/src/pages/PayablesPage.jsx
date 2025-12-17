import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Tooltip,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  useGetPayablesSummaryQuery,
  useGetSupplierPayablesQuery,
  useUpdatePayablesPaymentMutation,
  useGetSupplierPaymentHistoryQuery,
} from "../store/api/payableApi";
import { useGetSuppliersQuery } from "../store/api/supplierApi";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";
import {
  formatIndianNumber,
  parseFormattedNumber,
} from "../utils/numberFormat";

function PayablesPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [distributedPayments, setDistributedPayments] = useState({});
  const [historyMode, setHistoryMode] = useState(false);
  const [selectedHistoryPayment, setSelectedHistoryPayment] = useState(null);

  // Fetch payables summary
  const { data: summaryData, refetch: refetchSummary } =
    useGetPayablesSummaryQuery();

  // Fetch suppliers
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 1000 });
  const suppliers = suppliersData?.suppliers || [];

  // Fetch supplier payables when supplier is selected (always fetch if supplier selected, even in history mode when viewing details)
  const { data: supplierPayablesData, refetch: refetchSupplierPayables } =
    useGetSupplierPayablesQuery(selectedSupplier, {
      skip: !selectedSupplier,
    });

  // Fetch payment history when in history mode
  const { data: paymentHistoryData, refetch: refetchPaymentHistory } =
    useGetSupplierPaymentHistoryQuery(selectedSupplier, {
      skip: !selectedSupplier || !historyMode,
    });

  const [updatePayment, { isLoading: isUpdating }] =
    useUpdatePayablesPaymentMutation();

  const purchases = supplierPayablesData?.purchases || [];

  // Create a stable key for purchases to detect actual changes
  const purchasesKey = useMemo(() => {
    if (!purchases || purchases.length === 0) return "";
    return purchases
      .map((p) => `${p._id}-${p.outstandingAmount}-${p.date}`)
      .join("|");
  }, [purchases]);

  // Memoize outstanding bills to prevent unnecessary recalculations
  const outstandingBills = useMemo(() => {
    if (!purchases || purchases.length === 0) return [];
    return purchases
      .filter((p) => p.outstandingAmount > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [purchasesKey]);

  // Auto-distribute payment when payAmount changes - using useMemo instead of useEffect
  const calculatedDistribution = useMemo(() => {
    if (!payAmount || !selectedSupplier || outstandingBills.length === 0) {
      return {};
    }

    const amount = parseFloat(parseFormattedNumber(payAmount)) || 0;
    if (amount <= 0) {
      return {};
    }

    const distribution = {};
    let remainingAmount = amount;

    // Distribute payment across bills (oldest first)
    for (const bill of outstandingBills) {
      if (remainingAmount <= 0) break;

      const outstanding = bill.outstandingAmount;
      const paymentForThisBill = Math.min(remainingAmount, outstanding);

      distribution[bill._id] = {
        purchaseId: bill._id,
        paidAmount: parseFloat(paymentForThisBill.toFixed(2)),
        originalOutstanding: outstanding,
      };

      remainingAmount -= paymentForThisBill;
    }

    return distribution;
  }, [payAmount, selectedSupplier, outstandingBills]);

  // Update distributedPayments only when calculatedDistribution changes
  useEffect(() => {
    setDistributedPayments(calculatedDistribution);
  }, [calculatedDistribution]);

  // Refetch data when history mode or supplier changes
  useEffect(() => {
    if (selectedSupplier) {
      if (historyMode) {
        refetchPaymentHistory();
      } else {
        refetchSupplierPayables();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyMode, selectedSupplier]);

  const handleSupplierChange = (event) => {
    const supplier = event.target.value;
    setSelectedSupplier(supplier);
    setPayAmount("");
    setDistributedPayments({});
    setSelectedHistoryPayment(null);
  };

  const handleHistoryModeToggle = (event, newMode) => {
    if (newMode !== null) {
      setHistoryMode(newMode);
      setSelectedHistoryPayment(null);
      setPayAmount("");
      setDistributedPayments({});
      // useEffect will handle refetching when historyMode changes
    }
  };

  const handleHistoryPaymentClick = (payment) => {
    setSelectedHistoryPayment(payment);
    // Set the pay amount and distribution from history
    const totalAmount = payment.totalAmount;
    setPayAmount(formatIndianNumber(totalAmount));

    // Create distribution object from history
    const distribution = {};
    payment.distributions.forEach((dist) => {
      distribution[dist.purchaseId] = {
        purchaseId: dist.purchaseId,
        paidAmount: dist.paidAmount,
        originalOutstanding: dist.totalAmount - dist.paidAmount,
      };
    });
    setDistributedPayments(distribution);
  };

  const handleBackFromHistory = () => {
    setSelectedHistoryPayment(null);
    setPayAmount("");
    setDistributedPayments({});
  };

  const handlePayAmountChange = (e) => {
    const value = e.target.value;
    const parsed = parseFormattedNumber(value);
    if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
      const formatted = parsed ? formatIndianNumber(parsed) : "";
      setPayAmount(formatted);
    }
  };

  const handlePay = async () => {
    if (!selectedSupplier) {
      showToast(t("pleaseSelectSupplier"), "warning");
      return;
    }

    const amount = parseFloat(parseFormattedNumber(payAmount)) || 0;
    if (amount <= 0) {
      showToast(t("amountMustBeGreaterThanZero"), "warning");
      return;
    }

    const payments = Object.values(distributedPayments);
    if (payments.length === 0) {
      showToast(t("noBillsSelected"), "warning");
      return;
    }

    // Verify total distributed amount matches pay amount
    const totalDistributed = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    if (Math.abs(totalDistributed - amount) > 0.01) {
      showToast(t("distributedAmountMismatch"), "error");
      return;
    }

    try {
      await updatePayment({
        supplier: selectedSupplier,
        payments: payments,
      }).unwrap();

      showToast(t("paymentRecorded"), "success");
      setPayAmount("");
      setDistributedPayments({});
      refetchSummary();
      refetchSupplierPayables();
      if (historyMode) {
        refetchPaymentHistory();
      }
    } catch (error) {
      showToast(error.data?.message || t("failedToSave"), "error");
    }
  };

  // Calculate totals for selected supplier
  const supplierTotals = useMemo(() => {
    if (!supplierPayablesData) {
      return {
        totalOutstanding: 0,
        totalBills: 0,
        unpaidBills: 0,
        partialBills: 0,
        paidBills: 0,
      };
    }

    return {
      totalOutstanding: supplierPayablesData.totalOutstanding || 0,
      totalBills: supplierPayablesData.totalBills || 0,
      unpaidBills: supplierPayablesData.unpaidBills || 0,
      partialBills: supplierPayablesData.partialBills || 0,
      paidBills: supplierPayablesData.paidBills || 0,
    };
  }, [supplierPayablesData]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!summaryData) {
      return {
        totalPayables: 0,
        totalUnpaidBills: 0,
        totalPartialBills: 0,
        totalBills: 0,
      };
    }

    return {
      totalPayables: summaryData.totalPayables || 0,
      totalUnpaidBills: summaryData.totalUnpaidBills || 0,
      totalPartialBills: summaryData.totalPartialBills || 0,
      totalBills: summaryData.totalBills || 0,
    };
  }, [summaryData]);

  const totalDistributed = Object.values(distributedPayments).reduce(
    (sum, p) => sum + p.paidAmount,
    0
  );

  const payAmountNum = parseFloat(parseFormattedNumber(payAmount)) || 0;
  const remainingAfterDistribution = payAmountNum - totalDistributed;

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 1, fontSize: "2rem" }}
        >
          {t("payables")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.125rem" }}
        >
          {t("payablesSubtitle")}
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "#667eea", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      opacity: 0.9,
                      mb: 1.5,
                      fontSize: "1.125rem",
                      fontWeight: 500,
                    }}
                  >
                    {t("totalPayables")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    ₹
                    {summaryStats.totalPayables.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                </Box>
                <AccountBalanceWalletIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "#f5576c", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      opacity: 0.9,
                      mb: 1.5,
                      fontSize: "1.125rem",
                      fontWeight: 500,
                    }}
                  >
                    {t("unpaidBills")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {summaryStats.totalUnpaidBills}
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "#4facfe", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      opacity: 0.9,
                      mb: 1.5,
                      fontSize: "1.125rem",
                      fontWeight: 500,
                    }}
                  >
                    {t("partialBills")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {summaryStats.totalPartialBills}
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "#10b981", color: "white" }}>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      opacity: 0.9,
                      mb: 1.5,
                      fontSize: "1.125rem",
                      fontWeight: 500,
                    }}
                  >
                    {t("totalOutstandingBills")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {summaryStats.totalBills}
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {historyMode ? t("paymentHistory") : t("makePayment")}
            </Typography>
            <ToggleButtonGroup
              value={historyMode}
              exclusive
              onChange={handleHistoryModeToggle}
              aria-label="payment mode"
            >
              <ToggleButton value={false} aria-label="payment mode">
                {t("makePayment")}
              </ToggleButton>
              <ToggleButton value={true} aria-label="history mode">
                <HistoryIcon sx={{ mr: 1 }} />
                {t("history")}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>{t("supplier")}</InputLabel>
                <Select
                  value={selectedSupplier}
                  onChange={handleSupplierChange}
                  label={t("supplier")}
                >
                  <MenuItem value="">
                    <em>{t("selectSupplierToViewBills")}</em>
                  </MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier._id} value={supplier.name}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {!historyMode && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t("payAmount")}
                    value={payAmount}
                    onChange={handlePayAmountChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                    helperText={t("payAmountHelper")}
                    placeholder="0"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={handlePay}
                    disabled={
                      !selectedSupplier ||
                      !payAmount ||
                      payAmountNum <= 0 ||
                      Object.keys(distributedPayments).length === 0 ||
                      isUpdating
                    }
                    sx={{
                      height: "56px",
                      fontSize: "1.125rem",
                      fontWeight: 600,
                    }}
                  >
                    {isUpdating ? t("processing") : t("pay")}
                  </Button>
                </Grid>
              </>
            )}
          </Grid>

          {/* Distribution Summary */}
          {Object.keys(distributedPayments).length > 0 && !historyMode && (
            <Box mt={3} p={2} bgcolor="info.light" borderRadius={2}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {t("billsSelected")}: {Object.keys(distributedPayments).length}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {t("totalPayment")}: ₹
                {totalDistributed.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </Typography>
              {remainingAfterDistribution > 0.01 && (
                <Typography
                  variant="body2"
                  color="warning.main"
                  sx={{ fontWeight: 600 }}
                >
                  {t("remainingAfterPayment")}: ₹
                  {remainingAfterDistribution.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              )}
            </Box>
          )}

          {/* Historical Payment Summary */}
          {historyMode && selectedHistoryPayment && (
            <Box mt={3} p={2} bgcolor="success.light" borderRadius={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t("paymentDate")}:{" "}
                  {dayjs(selectedHistoryPayment.paymentDate).format(
                    "DD/MM/YYYY"
                  )}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackFromHistory}
                >
                  {t("back")}
                </Button>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {t("totalPayment")}: ₹
                {selectedHistoryPayment.totalAmount.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("billsPaid")}: {selectedHistoryPayment.distributions.length}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Bills Table or Payment History */}
      <Card>
        <CardContent>
          {!selectedSupplier ? (
            <Box textAlign="center" py={8} sx={{ color: "text.secondary" }}>
              <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t("selectSupplierToViewBills")}
              </Typography>
              <Typography variant="body2">
                {t("selectSupplierToViewBillsDescription")}
              </Typography>
            </Box>
          ) : historyMode ? (
            // Payment History View
            paymentHistoryData?.payments?.length === 0 ? (
              <Box textAlign="center" py={8} sx={{ color: "text.secondary" }}>
                <HistoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6">{t("noPaymentHistory")}</Typography>
              </Box>
            ) : selectedHistoryPayment ? (
              // Show bills table with historical distribution
              purchases.length === 0 ? (
                <Box textAlign="center" py={8} sx={{ color: "text.secondary" }}>
                  <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">{t("noBillsFound")}</Typography>
                </Box>
              ) : (
                <>
                  {/* Supplier Summary */}
                  <Box mb={3}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: "primary.light" }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("totalOutstanding")}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            ₹
                            {supplierTotals.totalOutstanding.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: "error.light" }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("unpaidBills")}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {supplierTotals.unpaidBills}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: "warning.light" }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("partialBills")}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {supplierTotals.partialBills}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: "success.light" }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("paidBills")}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {supplierTotals.paidBills}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("date")}</TableCell>
                          <TableCell>{t("itemName")}</TableCell>
                          <TableCell align="right">{t("quantity")}</TableCell>
                          <TableCell align="right">{t("rate")}</TableCell>
                          <TableCell align="right">
                            {t("totalAmount")}
                          </TableCell>
                          <TableCell align="right">{t("paidAmount")}</TableCell>
                          <TableCell align="right">
                            {t("outstandingAmount")}
                          </TableCell>
                          <TableCell align="center">
                            {t("paymentStatus")}
                          </TableCell>
                          <TableCell align="right">{t("paidOnDate")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchases.map((purchase) => {
                          const historyDist =
                            selectedHistoryPayment.distributions.find(
                              (d) =>
                                String(d.purchaseId) === String(purchase._id)
                            );
                          const isInHistory = !!historyDist;

                          return (
                            <TableRow
                              key={purchase._id}
                              sx={{
                                bgcolor: isInHistory
                                  ? "success.light"
                                  : "inherit",
                                "&:hover": { bgcolor: "action.hover" },
                              }}
                            >
                              <TableCell>
                                {dayjs(purchase.date).format("DD/MM/YYYY")}
                              </TableCell>
                              <TableCell>{purchase.itemName}</TableCell>
                              <TableCell align="right">
                                {purchase.quantity} {purchase.unit}
                              </TableCell>
                              <TableCell align="right">
                                ₹{purchase.rate.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                ₹{purchase.totalAmount.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                ₹{purchase.paidAmount.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color:
                                      purchase.outstandingAmount > 0
                                        ? "error.main"
                                        : "success.main",
                                  }}
                                >
                                  ₹{purchase.outstandingAmount.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={t(purchase.paymentStatus)}
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
                              <TableCell align="right">
                                {historyDist ? (
                                  <Tooltip
                                    title={`${t("paidOn")} ${dayjs(
                                      selectedHistoryPayment.paymentDate
                                    ).format("DD/MM/YYYY")}`}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                        color: "success.main",
                                      }}
                                    >
                                      ₹{historyDist.paidAmount.toFixed(2)}
                                    </Typography>
                                  </Tooltip>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    ₹0.00
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )
            ) : (
              // Payment History List
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {t("paymentHistory")}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("paymentDate")}</TableCell>
                        <TableCell align="right">{t("totalAmount")}</TableCell>
                        <TableCell align="right">{t("billsPaid")}</TableCell>
                        <TableCell align="center">{t("action")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistoryData?.payments?.map((payment) => (
                        <TableRow
                          key={payment._id}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                          onClick={() => handleHistoryPaymentClick(payment)}
                        >
                          <TableCell>
                            {dayjs(payment.paymentDate).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              ₹
                              {payment.totalAmount.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {payment.distributions.length}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHistoryPaymentClick(payment);
                              }}
                            >
                              {t("viewDetails")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )
          ) : purchases.length === 0 ? (
            <Box textAlign="center" py={8} sx={{ color: "text.secondary" }}>
              <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6">{t("noBillsFound")}</Typography>
            </Box>
          ) : (
            <>
              {/* Supplier Summary */}
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: "primary.light" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("totalOutstanding")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ₹
                        {supplierTotals.totalOutstanding.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: "error.light" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("unpaidBills")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {supplierTotals.unpaidBills}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: "warning.light" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("partialBills")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {supplierTotals.partialBills}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: "success.light" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("paidBills")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {supplierTotals.paidBills}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("date")}</TableCell>
                      <TableCell>{t("itemName")}</TableCell>
                      <TableCell align="right">{t("quantity")}</TableCell>
                      <TableCell align="right">{t("rate")}</TableCell>
                      <TableCell align="right">{t("totalAmount")}</TableCell>
                      <TableCell align="right">{t("paidAmount")}</TableCell>
                      <TableCell align="right">
                        {t("outstandingAmount")}
                      </TableCell>
                      <TableCell align="center">{t("paymentStatus")}</TableCell>
                      <TableCell align="right">{t("distributed")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.map((purchase) => {
                      const distribution = distributedPayments[purchase._id];
                      const isSelected = !!distribution;

                      return (
                        <TableRow
                          key={purchase._id}
                          sx={{
                            bgcolor: isSelected ? "action.selected" : "inherit",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <TableCell>
                            {dayjs(purchase.date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell>{purchase.itemName}</TableCell>
                          <TableCell align="right">
                            {purchase.quantity} {purchase.unit}
                          </TableCell>
                          <TableCell align="right">
                            ₹{purchase.rate.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{purchase.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{purchase.paidAmount.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color:
                                  purchase.outstandingAmount > 0
                                    ? "error.main"
                                    : "success.main",
                              }}
                            >
                              ₹{purchase.outstandingAmount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={t(purchase.paymentStatus)}
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
                          <TableCell align="right">
                            {distribution ? (
                              <Tooltip
                                title={`${t("remainingAfterPayment")}: ₹${(
                                  purchase.outstandingAmount -
                                  distribution.paidAmount
                                ).toFixed(2)}`}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "primary.main",
                                  }}
                                >
                                  ₹{distribution.paidAmount.toFixed(2)}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                ₹0.00
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default PayablesPage;
