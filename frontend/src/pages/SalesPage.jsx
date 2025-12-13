import { useState } from 'react';
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
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DataTable from '../components/common/DataTable';
import SalesModal from '../components/Sales/SalesModal';
import { useGetSalesQuery, useDeleteSaleMutation } from '../store/api/salesApi';
import { useToast } from '../components/common/ToastProvider';
import { useTranslation } from '../hooks/useTranslation';
import dayjs from 'dayjs';

function SalesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  const { showToast } = useToast();
  const { data, isLoading, refetch } = useGetSalesQuery({
    page: page + 1,
    limit: rowsPerPage,
    search,
    startDate,
    endDate,
  });
  const [deleteSale] = useDeleteSaleMutation();

  const handleOpenModal = () => {
    setEditingSale(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSale(null);
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('deleteSaleConfirm'))) {
      try {
        await deleteSale(id).unwrap();
        showToast(t('saleDeleted'), 'success');
        refetch();
      } catch (error) {
        showToast(error.data?.message || t('failedToDelete'), 'error');
      }
    }
  };

  const columns = [
    { id: 'date', label: t('date') },
    { id: 'itemName', label: t('itemName') },
    { id: 'quantity', label: t('quantity') },
    { id: 'rate', label: t('rate') },
    { id: 'customer', label: t('customer') },
    { id: 'total', label: t('total') },
    { id: 'paymentStatus', label: t('paymentStatus') },
    { id: 'outstandingAmount', label: t('outstandingAmount') },
  ];

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  const rows = (data?.sales || []).map((sale) => ({
    id: sale._id,
    date: dayjs(sale.date).format('DD/MM/YYYY'),
    itemName: sale.itemName,
    quantity: sale.quantity,
    rate: `₹${sale.rate.toFixed(2)}`,
    customer: sale.customer,
    total: `₹${sale.total.toFixed(2)}`,
    paymentStatus: (
      <Chip
        label={t(sale.paymentStatus || 'unpaid')}
        color={getPaymentStatusColor(sale.paymentStatus || 'unpaid')}
        size="small"
      />
    ),
    outstandingAmount: `₹${(sale.outstandingAmount || sale.total).toFixed(2)}`,
    original: sale,
  }));

  const totalRevenue = data?.sales?.reduce((sum, s) => sum + s.total, 0) || 0;
  const totalSales = data?.total || 0;
  const totalOutstanding = data?.sales?.reduce((sum, s) => sum + (s.outstandingAmount || s.total), 0) || 0;
  const totalPaid = data?.sales?.reduce((sum, s) => sum + (s.paidAmount || 0), 0) || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: '2rem' }}>
            {t('salesTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
            {t('salesSubtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          size="large"
        >
          {t('addSale')}
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#667eea', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {t('totalSales')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalSales}
                  </Typography>
                </Box>
                <PointOfSaleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#f5576c', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {t('totalRevenue')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#10b981', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {t('paidAmount')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#f59e0b', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {t('outstandingAmount')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('searchSales')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
              label={t('startDate')}
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('endDate')}
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              {(startDate || endDate) && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setPage(0);
                  }}
                >
                  {t('clearFilters')}
                </Button>
              )}
            </Grid>
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
              onClick={() => handleEdit(row.original)}
              sx={{ 
                mr: 1,
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light', color: 'white' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(row.id)}
              sx={{ 
                color: 'error.main',
                '&:hover': { bgcolor: 'error.light', color: 'white' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      <SalesModal
        open={modalOpen}
        onClose={handleCloseModal}
        sale={editingSale}
        onSuccess={() => {
          handleCloseModal();
          refetch();
        }}
      />
    </Box>
  );
}

export default SalesPage;

