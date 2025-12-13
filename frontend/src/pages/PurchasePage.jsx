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
  Chip,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DataTable from '../components/common/DataTable';
import PurchaseModal from '../components/Purchase/PurchaseModal';
import { useGetPurchasesQuery, useDeletePurchaseMutation } from '../store/api/purchaseApi';
import { useToast } from '../components/common/ToastProvider';
import { useTranslation } from '../hooks/useTranslation';
import dayjs from 'dayjs';

function PurchasePage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const { showToast } = useToast();
  const { data, isLoading, refetch } = useGetPurchasesQuery({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });
  const [deletePurchase] = useDeletePurchaseMutation();

  const handleOpenModal = () => {
    setEditingPurchase(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPurchase(null);
  };

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('deletePurchaseConfirm'))) {
      try {
        await deletePurchase(id).unwrap();
        showToast(t('purchaseDeleted'), 'success');
        refetch();
      } catch (error) {
        showToast(error.data?.message || t('failedToDelete'), 'error');
      }
    }
  };

  const totalAmount = data?.purchases?.reduce((sum, p) => sum + p.totalAmount, 0) || 0;
  const totalPurchases = data?.total || 0;

  const columns = [
    { id: 'date', label: t('date') },
    { id: 'itemName', label: t('itemName') },
    { id: 'quantity', label: t('quantity') },
    { id: 'unit', label: t('unit') },
    { id: 'rate', label: t('rate') },
    { id: 'supplier', label: t('supplier') },
    { id: 'totalAmount', label: t('totalAmount') },
  ];

  const rows = (data?.purchases || []).map((purchase) => ({
    id: purchase._id,
    date: dayjs(purchase.date).format('DD/MM/YYYY'),
    itemName: purchase.itemName,
    quantity: purchase.quantity,
    unit: purchase.unit,
    rate: `₹${purchase.rate.toFixed(2)}`,
    supplier: purchase.supplier,
    totalAmount: `₹${purchase.totalAmount.toFixed(2)}`,
    original: purchase,
  }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: '2rem' }}>
            {t('purchaseTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
            {t('purchaseSubtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          size="large"
        >
          {t('addPurchase')}
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#667eea', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 1.5, fontSize: '1.125rem', fontWeight: 500 }}>
                    {t('totalPurchases')}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
                    {totalPurchases}
                  </Typography>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#f5576c', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 1.5, fontSize: '1.125rem', fontWeight: 500 }}>
                    {t('totalAmount')}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
                    ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
          <TextField
            fullWidth
            placeholder={t('searchPurchase')}
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
              title={t('delete')}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      <PurchaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        purchase={editingPurchase}
        onSuccess={() => {
          handleCloseModal();
          refetch();
        }}
      />
    </Box>
  );
}

export default PurchasePage;

