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
  useGetReceivablesSummaryQuery,
  useGetCustomerReceivablesQuery,
  useUpdateReceivablesPaymentMutation,
  useGetCustomerPaymentHistoryQuery,
} from "../store/api/receivableApi";
import { useGetCustomersQuery } from "../store/api/customerApi";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";
import {
  formatIndianNumber,
  parseFormattedNumber,
} from "../utils/numberFormat";

function ReceivablesPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [billPayments, setBillPayments] = useState({});
  const [historyMode, setHistoryMode] = useState(false);
  const [selectedHistoryPayment, setSelectedHistoryPayment] = useState(null);

  // Fetch receivables summary
  const { data: summaryData, refetch: refetchSummary } =
    useGetReceivablesSummaryQuery();

  // Fetch customers
  const { data: customersData } = useGetCustomersQuery({ limit: 1000 });
  const customers = customersData?.customers || [];

  // Fetch customer receivables when customer is selected
  const { data: customerReceivablesData, refetch: refetchCustomerReceivables } =
    useGetCustomerReceivablesQuery(selectedCustomer, {
      skip: !selectedCustomer,
    });

  // Fetch payment history when in history mode
  const { data: paymentHistoryData, refetch: refetchPaymentHistory } =
    useGetCustomerPaymentHistoryQuery(selectedCustomer, {
      skip: !selectedCustomer || !historyMode,
    });

  const [updatePayment, { isLoading: isUpdating }] =
    useUpdateReceivablesPaymentMutation();

  // Get all sales (not filtered) for history view, or only outstanding for payment view
  const allSales = customerReceivablesData?.sales || [];
  const sales = useMemo(() => {
    if (historyMode && selectedHistoryPayment) {
      // In history view, show all sales
      return allSales;
    }
    // In payment view, only show unpaid and partial bills
    return allSales.filter((sale) => sale.outstandingAmount > 0);
  }, [allSales, historyMode, selectedHistoryPayment]);

  // Calculate total payment from selected bills
  const totalPayment = useMemo(() => {
    return Array.from(selectedBills).reduce((sum, saleId) => {
      const payment = billPayments[saleId] || 0;
      return sum + payment;
    }, 0);
  }, [selectedBills, billPayments]);

  const handleCustomerChange = (event) => {
    const customer = event.target.value;
    setSelectedCustomer(customer);
    setSelectedBills(new Set());
    setBillPayments({});
    setSelectedHistoryPayment(null);
  };

  const handleHistoryModeToggle = (event, newMode) => {
    if (newMode !== null) {
      setHistoryMode(newMode);
      setSelectedHistoryPayment(null);
      setSelectedBills(new Set());
      setBillPayments({});
      // useEffect will handle refetching when historyMode changes
    }
  };

  const handleHistoryPaymentClick = (payment) => {
    setSelectedHistoryPayment(payment);
    // Clear payment selections when viewing history
    setSelectedBills(new Set());
    setBillPayments({});
  };

  const handleBackFromHistory = () => {
    setSelectedHistoryPayment(null);
    setSelectedBills(new Set());
    setBillPayments({});
  };

  // Refetch data when history mode or customer changes
  useEffect(() => {
    if (selectedCustomer) {
      if (historyMode) {
        refetchPaymentHistory();
      } else {
        refetchCustomerReceivables();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyMode, selectedCustomer]);

  const handleBillSelect = (saleId, isSelected) => {
    const newSelected = new Set(selectedBills);
    if (isSelected) {
      newSelected.add(saleId);
      // Initialize payment amount to outstanding amount if not set
      if (!billPayments[saleId]) {
        const sale = sales.find((s) => s._id === saleId);
        if (sale && sale.outstandingAmount > 0) {
          setBillPayments((prev) => ({
            ...prev,
            [saleId]: sale.outstandingAmount,
          }));
        }
      }
    } else {
      newSelected.delete(saleId);
      // Remove payment amount when deselected
      setBillPayments((prev) => {
        const newPayments = { ...prev };
        delete newPayments[saleId];
        return newPayments;
      });
    }
    setSelectedBills(newSelected);
  };

  const handleBillPaymentChange = (saleId, value) => {
    const parsed = parseFormattedNumber(value);
    if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
      const numValue = parseFloat(parsed) || 0;
      const sale = sales.find((s) => s._id === saleId);

      if (sale) {
        // Limit payment to outstanding amount
        const maxPayment = sale.outstandingAmount;
        const finalValue = Math.min(numValue, maxPayment);

        const formatted = finalValue > 0 ? formatIndianNumber(finalValue) : "";
        setBillPayments((prev) => ({
          ...prev,
          [saleId]: finalValue,
        }));
      }
    }
  };

  const handlePay = async () => {
    if (!selectedCustomer) {
      showToast(t("pleaseSelectCustomer"), "warning");
      return;
    }

    if (selectedBills.size === 0) {
      showToast(t("pleaseSelectAtLeastOneSale"), "warning");
      return;
    }

    const payments = Array.from(selectedBills)
      .map((saleId) => {
        const payment = billPayments[saleId] || 0;
        if (payment > 0) {
          return {
            saleId,
            paidAmount: payment,
          };
        }
        return null;
      })
      .filter((p) => p !== null);

    if (payments.length === 0) {
      showToast(t("amountMustBeGreaterThanZero"), "warning");
      return;
    }

    try {
      await updatePayment({
        customer: selectedCustomer,
        payments: payments,
      }).unwrap();

      showToast(t("paymentRecorded"), "success");
      setSelectedBills(new Set());
      setBillPayments({});
      refetchSummary();
      refetchCustomerReceivables();
      if (historyMode) {
        refetchPaymentHistory();
      }
    } catch (error) {
      showToast(error.data?.message || t("failedToSave"), "error");
    }
  };

  // Calculate totals for selected customer
  const customerTotals = useMemo(() => {
    if (!customerReceivablesData) {
      return {
        totalOutstanding: 0,
        totalBills: 0,
        unpaidBills: 0,
        partialBills: 0,
        paidBills: 0,
      };
    }

    return {
      totalOutstanding: customerReceivablesData.totalOutstanding || 0,
      totalBills: customerReceivablesData.totalBills || 0,
      unpaidBills: customerReceivablesData.unpaidBills || 0,
      partialBills: customerReceivablesData.partialBills || 0,
      paidBills: customerReceivablesData.paidBills || 0,
    };
  }, [customerReceivablesData]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!summaryData) {
      return {
        totalReceivables: 0,
        totalUnpaidBills: 0,
        totalPartialBills: 0,
        totalBills: 0,
      };
    }

    return {
      totalReceivables: summaryData.totalReceivables || 0,
      totalUnpaidBills: summaryData.totalUnpaidBills || 0,
      totalPartialBills: summaryData.totalPartialBills || 0,
      totalBills: summaryData.totalBills || 0,
    };
  }, [summaryData]);

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 1, fontSize: "2rem" }}
        >
          {t("receivables")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.125rem" }}
        >
          {t("receivablesSubtitle")}
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
                    {t("totalReceivables")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    ₹
                    {summaryStats.totalReceivables.toLocaleString("en-IN", {
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
                <InputLabel>{t("customer")}</InputLabel>
                <Select
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  label={t("customer")}
                >
                  <MenuItem value="">
                    <em>{t("selectCustomerToViewBills")}</em>
                  </MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer._id} value={customer.name}>
                      {customer.name}
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
                    label={t("totalPayment")}
                    value={formatIndianNumber(totalPayment) || "0"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                    disabled
                    helperText={t("totalPaymentHelper")}
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
                      !selectedCustomer ||
                      selectedBills.size === 0 ||
                      totalPayment <= 0 ||
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

          {/* Selection Summary */}
          {selectedBills.size > 0 && !historyMode && (
            <Box mt={3} p={2} bgcolor="info.light" borderRadius={2}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {t("billsSelected")}: {selectedBills.size}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("totalPayment")}: ₹
                {totalPayment.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </Typography>
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
          {!selectedCustomer ? (
            <Box textAlign="center" py={8} sx={{ color: "text.secondary" }}>
              <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t("selectCustomerToViewBills")}
              </Typography>
              <Typography variant="body2">
                {t("selectCustomerToViewBillsDescription")}
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
              allSales.length === 0 ? (
                <Box textAlign="center" py={8} sx={{ color: "text.secondary" }}>
                  <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">{t("noBillsFound")}</Typography>
                </Box>
              ) : (
                <>
                  {/* Customer Summary */}
                  <Box mb={3}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: "primary.light" }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("totalOutstanding")}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            ₹
                            {customerTotals.totalOutstanding.toLocaleString(
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
                            {customerTotals.unpaidBills}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: "warning.light" }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("partialBills")}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {customerTotals.partialBills}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: "success.light" }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("paidBills")}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {customerTotals.paidBills}
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
                          <TableCell align="right">{t("subtotal")}</TableCell>
                          <TableCell align="right">{t("discount")}</TableCell>
                          <TableCell align="right">{t("total")}</TableCell>
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
                        {allSales.map((sale) => {
                          const historyDist =
                            selectedHistoryPayment.distributions.find(
                              (d) => String(d.saleId) === String(sale._id)
                            );
                          const isInHistory = !!historyDist;

                          return (
                            <TableRow
                              key={sale._id}
                              sx={{
                                bgcolor: isInHistory
                                  ? "success.light"
                                  : "inherit",
                                "&:hover": { bgcolor: "action.hover" },
                              }}
                            >
                              <TableCell>
                                {dayjs(sale.date).format("DD/MM/YYYY")}
                              </TableCell>
                              <TableCell>{sale.itemName}</TableCell>
                              <TableCell align="right">
                                {sale.quantity} kg
                              </TableCell>
                              <TableCell align="right">
                                ₹{sale.rate.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                ₹{sale.subtotal.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                ₹{sale.discount.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                ₹{sale.total.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                ₹{sale.paidAmount.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color:
                                      sale.outstandingAmount > 0
                                        ? "error.main"
                                        : "success.main",
                                  }}
                                >
                                  ₹{sale.outstandingAmount.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={t(sale.paymentStatus)}
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
          ) : sales.length === 0 ? (
            <Box textAlign="center" py={8} sx={{ color: "text.secondary" }}>
              <ReceiptIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6">{t("noBillsFound")}</Typography>
            </Box>
          ) : (
            <>
              {/* Customer Summary */}
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: "primary.light" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("totalOutstanding")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ₹
                        {customerTotals.totalOutstanding.toLocaleString(
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
                        {customerTotals.unpaidBills}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: "warning.light" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("partialBills")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {customerTotals.partialBills}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, bgcolor: "success.light" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("paidBills")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {customerTotals.paidBills}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>{t("date")}</TableCell>
                      <TableCell>{t("itemName")}</TableCell>
                      <TableCell align="right">{t("quantity")}</TableCell>
                      <TableCell align="right">{t("rate")}</TableCell>
                      <TableCell align="right">{t("subtotal")}</TableCell>
                      <TableCell align="right">{t("discount")}</TableCell>
                      <TableCell align="right">{t("total")}</TableCell>
                      <TableCell align="right">{t("paidAmount")}</TableCell>
                      <TableCell align="right">
                        {t("outstandingAmount")}
                      </TableCell>
                      <TableCell align="center">{t("paymentStatus")}</TableCell>
                      <TableCell align="right">{t("payAmount")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.map((sale) => {
                      const isSelected = selectedBills.has(sale._id);
                      const canPay = sale.outstandingAmount > 0;
                      const paymentAmount = billPayments[sale._id] || 0;

                      return (
                        <TableRow
                          key={sale._id}
                          sx={{
                            bgcolor: isSelected ? "action.selected" : "inherit",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) =>
                                handleBillSelect(sale._id, e.target.checked)
                              }
                              disabled={!canPay}
                            />
                          </TableCell>
                          <TableCell>
                            {dayjs(sale.date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell>{sale.itemName}</TableCell>
                          <TableCell align="right">
                            {sale.quantity} kg
                          </TableCell>
                          <TableCell align="right">
                            ₹{sale.rate.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{sale.subtotal.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{sale.discount.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{sale.total.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{sale.paidAmount.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color:
                                  sale.outstandingAmount > 0
                                    ? "error.main"
                                    : "success.main",
                              }}
                            >
                              ₹{sale.outstandingAmount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={t(sale.paymentStatus)}
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
                          <TableCell align="right">
                            {isSelected && canPay ? (
                              <TextField
                                size="small"
                                value={
                                  paymentAmount > 0
                                    ? formatIndianNumber(paymentAmount)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleBillPaymentChange(
                                    sale._id,
                                    e.target.value
                                  )
                                }
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      ₹
                                    </InputAdornment>
                                  ),
                                }}
                                inputProps={{
                                  style: { textAlign: "right", width: "100px" },
                                }}
                                helperText={`Max: ₹${sale.outstandingAmount.toFixed(
                                  2
                                )}`}
                                sx={{ minWidth: "150px" }}
                              />
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

export default ReceivablesPage;
