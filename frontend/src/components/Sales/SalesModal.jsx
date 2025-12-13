import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import Modal from '../common/Modal';
import InvoicePreview from './InvoicePreview';
import { useCreateSaleMutation, useUpdateSaleMutation } from '../../store/api/salesApi';
import { useGetStockQuery } from '../../store/api/stockApi';
import { useGetCustomersQuery } from '../../store/api/customerApi';
import { useToast } from '../common/ToastProvider';
import { useTranslation } from '../../hooks/useTranslation';
import dayjs from 'dayjs';

function SalesModal({ open, onClose, sale, onSuccess }) {
  const { t } = useTranslation();
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdSale, setCreatedSale] = useState(null);
  const [formData, setFormData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    itemName: '',
    quantity: '',
    rate: '',
    customer: '',
    discount: '',
    discountType: 'fixed',
    paidAmount: '',
  });

  const { showToast } = useToast();
  const [createSale] = useCreateSaleMutation();
  const [updateSale] = useUpdateSaleMutation();
  
  const { data: stockData } = useGetStockQuery({ limit: 1000 });
  const { data: customersData } = useGetCustomersQuery({ limit: 1000 });
  const availableStock = stockData?.stock?.find(
    (item) => item.itemName === formData.itemName
  );
  const customers = customersData?.customers || [];

  useEffect(() => {
    if (sale) {
      setFormData({
        date: dayjs(sale.date).format('YYYY-MM-DD'),
        itemName: sale.itemName || '',
        quantity: sale.quantity || '',
        rate: sale.rate || '',
        customer: sale.customer || '',
        discount: sale.discount || '',
        discountType: sale.discountType || 'fixed',
        paidAmount: sale.paidAmount || '',
      });
    } else {
      setFormData({
        date: dayjs().format('YYYY-MM-DD'),
        itemName: '',
        quantity: '',
        rate: '',
        customer: '',
        discount: '',
        discountType: 'fixed',
        paidAmount: '',
      });
    }
  }, [sale, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateSubtotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.rate) || 0;
    return qty * rate;
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(formData.discount) || 0;
    if (discount <= 0) return 0;
    
    if (formData.discountType === 'percentage') {
      return (subtotal * discount) / 100;
    } else {
      return Math.min(discount, subtotal); // Don't allow discount more than subtotal
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!formData.itemName || !formData.quantity || !formData.rate || !formData.customer) {
      showToast(t('fillAllFields'), 'error');
      return;
    }

    if (parseFloat(formData.quantity) <= 0 || parseFloat(formData.rate) <= 0) {
      showToast(t('quantityRateGreaterThanZero'), 'error');
      return;
    }

    const requestedQty = parseFloat(formData.quantity);
    if (!sale && availableStock && availableStock.quantity < requestedQty) {
      showToast(
        `${t('insufficientStock')}. ${t('availableStock')}: ${availableStock.quantity} ${availableStock.unit}`,
        'error'
      );
      return;
    }

    try {
      const data = {
        date: formData.date,
        itemName: formData.itemName,
        quantity: requestedQty,
        rate: parseFloat(formData.rate),
        customer: formData.customer,
        discount: parseFloat(formData.discount) || 0,
        discountType: formData.discountType,
        paidAmount: parseFloat(formData.paidAmount) || 0,
      };

      if (sale) {
        await updateSale({ id: sale._id, ...data }).unwrap();
        showToast(t('saleUpdated'), 'success');
        onSuccess();
      } else {
        const result = await createSale(data).unwrap();
        showToast(t('saleCreated'), 'success');
        setCreatedSale(result);
        setShowInvoice(true);
        // Don't call onSuccess yet, wait for invoice to close
      }
    } catch (error) {
      showToast(error.data?.message || t('failedToSave'), 'error');
    }
  };

  const stockItems = stockData?.stock || [];
  const selectedCustomer = customers.find((c) => c.name === formData.customer);

  const handleInvoiceClose = () => {
    setShowInvoice(false);
    setCreatedSale(null);
    onSuccess();
    onClose();
  };

  return (
    <>
      <Modal
      open={open}
      onClose={onClose}
      title={sale ? t('editSale') : t('newSale')}
      onSubmit={handleSubmit}
      submitText={sale ? t('save') : t('add')}
    >
      <Box sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('date')}
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>{t('itemName')}</InputLabel>
              <Select
                value={formData.itemName}
                label={t('itemName')}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              >
                {stockItems.map((item) => (
                  <MenuItem key={item.itemName} value={item.itemName}>
                    {item.itemName} ({item.quantity} {item.unit} {t('availableStock').toLowerCase()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {availableStock && (
            <Grid item xs={12}>
              <Alert severity="info">
                {t('availableStock')}: {availableStock.quantity} {availableStock.unit}
              </Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('quantity')}
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              inputProps={{ min: 0, step: 0.01 }}
              required
              error={
                availableStock &&
                parseFloat(formData.quantity) > availableStock.quantity &&
                !sale
              }
              helperText={
                availableStock &&
                parseFloat(formData.quantity) > availableStock.quantity &&
                !sale
                  ? `${t('cannotExceedStock')} (${availableStock.quantity} ${availableStock.unit})`
                  : ''
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('rate')}
              name="rate"
              type="number"
              value={formData.rate}
              onChange={handleChange}
              inputProps={{ min: 0, step: 0.01 }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>{t('customer')}</InputLabel>
              <Select
                value={formData.customer}
                label={t('customer')}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer.name}>
                    {customer.name} {customer.city && `- ${customer.city}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('discountType')}</InputLabel>
              <Select
                value={formData.discountType}
                label={t('discountType')}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value, discount: '' })}
              >
                <MenuItem value="fixed">{t('discountFixed')}</MenuItem>
                <MenuItem value="percentage">{t('discountPercentage')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('discount')}
              name="discount"
              type="number"
              value={formData.discount}
              onChange={handleChange}
              inputProps={{ min: 0, step: 0.01 }}
              helperText={formData.discountType === 'percentage' ? 'Enter percentage (e.g., 10 for 10%)' : 'Enter fixed amount'}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>{t('subtotal')}: ₹{calculateSubtotal().toFixed(2)}</strong>
              </Typography>
              {calculateDiscount() > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('discount')}: -₹{calculateDiscount().toFixed(2)}
                </Typography>
              )}
              <Typography variant="h6">
                <strong>{t('total')}: ₹{calculateTotal()}</strong>
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('paidAmount')}
              name="paidAmount"
              type="number"
              value={formData.paidAmount}
              onChange={handleChange}
              inputProps={{ min: 0, step: 0.01, max: parseFloat(calculateTotal()) }}
              helperText={`${t('outstandingAmount')}: ₹${(parseFloat(calculateTotal()) - (parseFloat(formData.paidAmount) || 0)).toFixed(2)}`}
            />
          </Grid>
        </Grid>
      </Box>
    </Modal>

    {createdSale && (
      <InvoicePreview
        open={showInvoice}
        onClose={handleInvoiceClose}
        sale={createdSale}
        customer={selectedCustomer}
      />
    )}
    </>
  );
}

export default SalesModal;

