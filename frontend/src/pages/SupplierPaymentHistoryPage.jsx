import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DataTable from "../components/common/DataTable";
import {
  useGetAllPaymentsQuery,
  useDeletePaymentMutation,
} from "../store/api/supplierPaymentApi";
import { useGetSuppliersQuery } from "../store/api/supplierApi";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";

function SupplierPaymentHistoryPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { showToast } = useToast();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 1000 });
  const suppliers = suppliersData?.suppliers || [];

  const { data, isLoading, refetch } = useGetAllPaymentsQuery({
    page: page + 1,
    limit: rowsPerPage,
    supplierId,
    startDate,
    endDate,
    search,
  });

  const [deletePayment, { isLoading: deleting }] = useDeletePaymentMutation();

  const handleDelete = async (id) => {
    if (window.confirm(t("deletePaymentConfirm"))) {
      try {
        await deletePayment(id).unwrap();
        showToast(t("paymentDeleted"), "success");
        refetch();
      } catch (error) {
        showToast(error.data?.message || t("failedToDelete"), "error");
      }
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailDialogOpen(false);
    setSelectedPayment(null);
  };

  const totalPayments = data?.total || 0;
  const totalAmount =
    data?.payments?.reduce((sum, p) => sum + p.paymentAmount, 0) || 0;

  const columns = [
    { id: "paymentDate", label: t("paymentDate") },
    { id: "supplierName", label: t("supplier") },
    { id: "paymentAmount", label: t("paymentAmount") },
    { id: "allocatedAmount", label: t("allocatedAmount") },
    { id: "billsCount", label: t("bills") },
    { id: "actions", label: t("actions") },
  ];

  const rows = (data?.payments || []).map((payment) => ({
    id: payment._id,
    paymentDate: dayjs(payment.paymentDate).format("DD/MM/YYYY HH:mm:ss"),
    supplierName: payment.supplierName,
    paymentAmount: `₹${payment.paymentAmount.toFixed(2)}`,
    allocatedAmount: `₹${payment.allocatedAmount.toFixed(2)}`,
    billsCount: payment.allocations?.length || 0,
    original: payment,
  }));

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
            {t("supplierPaymentHistory")}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: "1.125rem" }}
          >
            {t("supplierPaymentHistorySubtitle")}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
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
                    {t("totalPayments")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {totalPayments}
                  </Typography>
                </Box>
                <HistoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                    {t("totalAmount")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    ₹
                    {totalAmount.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder={t("searchSupplier")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label={t("startDate")}
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label={t("endDate")}
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t("supplier")}</InputLabel>
                <Select
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    setPage(0);
                  }}
                  label={t("supplier")}
                >
                  <MenuItem value="">{t("all")}</MenuItem>
                  {suppliers.map((sup) => (
                    <MenuItem key={sup._id} value={sup._id}>
                      {sup.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {(startDate || endDate || supplierId || search) && (
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSupplierId("");
                    setSearch("");
                    setPage(0);
                  }}
                >
                  {t("clearFilters")}
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={isLoading}
        renderActions={(row) => (
          <Box>
            <IconButton
              size="small"
              onClick={() => handleViewDetails(row.original)}
              sx={{
                mr: 1,
                color: "primary.main",
                "&:hover": { bgcolor: "primary.light", color: "white" },
              }}
              title={t("viewDetails")}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(row.id)}
              disabled={deleting}
              sx={{
                color: "error.main",
                "&:hover": { bgcolor: "error.light", color: "white" },
              }}
              title={t("delete")}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        onRowClick={(row) => handleViewDetails(row.original)}
      />

      {/* Payment Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("paymentDetails")}</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t("supplier")}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedPayment.supplierName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t("paymentDate")}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {dayjs(selectedPayment.paymentDate).format("DD/MM/YYYY")}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t("paymentAmount")}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="primary">
                    ₹{selectedPayment.paymentAmount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t("allocatedAmount")}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="success.main"
                  >
                    ₹{selectedPayment.allocatedAmount.toFixed(2)}
                  </Typography>
                </Grid>
                {selectedPayment.remainingAmount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t("remainingAmount")}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color="warning.main"
                    >
                      ₹{selectedPayment.remainingAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t("allocatedToBills")}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("invoiceNo")}</TableCell>
                      <TableCell align="right">{t("amount")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPayment.allocations?.map((allocation, index) => (
                      <TableRow key={index}>
                        <TableCell>{allocation.invoiceNo}</TableCell>
                        <TableCell align="right">
                          ₹{allocation.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>{t("close")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SupplierPaymentHistoryPage;
