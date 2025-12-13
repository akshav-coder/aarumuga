import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Chip,
  Grid,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import DataTable from '../components/common/DataTable';
import StockAdjustModal from '../components/Stock/StockAdjustModal';
import { useGetStockQuery } from '../store/api/stockApi';
import { useToast } from '../components/common/ToastProvider';
import { useTranslation } from '../hooks/useTranslation';
import dayjs from 'dayjs';

function StockPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  const { showToast } = useToast();
  const { data, isLoading, refetch } = useGetStockQuery({
    page: page + 1,
    limit: rowsPerPage,
    search,
    lowStock: lowStockFilter,
  });

  const handleOpenModal = (stock) => {
    setEditingStock(stock);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStock(null);
  };

  const isLowStock = (stock) => {
    return stock.quantity <= stock.lowStockThreshold;
  };

  const columns = [
    { id: 'itemName', label: t('itemName') },
    { id: 'quantity', label: t('currentQuantity') },
    { id: 'unit', label: t('unit') },
    { id: 'lastUpdated', label: t('lastUpdated') },
    { id: 'status', label: t('status') },
  ];

  const rows = (data?.stock || []).map((stock) => ({
    id: stock._id || stock.itemName,
    itemName: stock.itemName,
    quantity: (
      <Box>
        <Typography
          component="span"
          sx={{
            color: isLowStock(stock) ? 'error.main' : 'text.primary',
            fontWeight: isLowStock(stock) ? 'bold' : 'normal',
          }}
        >
          {stock.quantity}
        </Typography>
      </Box>
    ),
    unit: stock.unit,
    lastUpdated: dayjs(stock.lastUpdated).format('DD/MM/YYYY HH:mm'),
    status: isLowStock(stock) ? (
      <Chip label={t('lowStock')} color="error" size="small" />
    ) : (
      <Chip label={t('inStock')} color="success" size="small" />
    ),
    original: stock,
  }));

  const totalItems = data?.total || 0;
  const lowStockItems = data?.stock?.filter(item => item.quantity <= item.lowStockThreshold).length || 0;

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: '2rem' }}>
          {t('stockTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
          {t('stockSubtitle')}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#667eea', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 1.5, fontSize: '1.125rem', fontWeight: 500 }}>
                    {t('stockItems')}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
                    {totalItems}
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 48, opacity: 0.8 }} />
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
                    {t('lowStockItems')}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '2.5rem' }}>
                    {lowStockItems}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder={t('searchStock')}
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
              sx={{ flexGrow: 1, minWidth: 200, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
            />
            <Button
              variant={lowStockFilter ? 'contained' : 'outlined'}
              onClick={() => {
                setLowStockFilter(!lowStockFilter);
                setPage(0);
              }}
              startIcon={<WarningIcon />}
            >
              {lowStockFilter ? t('showAll') : t('showLowStockOnly')}
            </Button>
          </Box>
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
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleOpenModal(row.original)}
          >
            {t('adjustStock')}
          </Button>
        )}
      />

      <StockAdjustModal
        open={modalOpen}
        onClose={handleCloseModal}
        stock={editingStock}
        onSuccess={() => {
          handleCloseModal();
          refetch();
        }}
      />
    </Box>
  );
}

export default StockPage;

