import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import Modal from '../common/Modal';
import { useCreatePurchaseMutation, useUpdatePurchaseMutation } from '../../store/api/purchaseApi';
import { useGetSuppliersQuery } from '../../store/api/supplierApi';
import { useToast } from '../common/ToastProvider';
import { useTranslation } from '../../hooks/useTranslation';
import dayjs from 'dayjs';

function PurchaseModal({ open, onClose, purchase, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    itemName: '',
    quantity: '',
    unit: '',
    rate: '',
    supplier: '',
  });

  const { showToast } = useToast();
  const [createPurchase] = useCreatePurchaseMutation();
  const [updatePurchase] = useUpdatePurchaseMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 1000 });
  const suppliers = suppliersData?.suppliers || [];

  useEffect(() => {
    if (purchase) {
      setFormData({
        date: dayjs(purchase.date).format('YYYY-MM-DD'),
        itemName: purchase.itemName || '',
        quantity: purchase.quantity || '',
        unit: purchase.unit || '',
        rate: purchase.rate || '',
        supplier: purchase.supplier || '',
      });
    } else {
      setFormData({
        date: dayjs().format('YYYY-MM-DD'),
        itemName: '',
        quantity: '',
        unit: '',
        rate: '',
        supplier: '',
      });
    }
  }, [purchase, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.rate) || 0;
    return (qty * rate).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!formData.itemName || !formData.quantity || !formData.unit || !formData.rate || !formData.supplier) {
      showToast(t('fillAllFields'), 'error');
      return;
    }

    if (parseFloat(formData.quantity) <= 0 || parseFloat(formData.rate) <= 0) {
      showToast(t('quantityRateGreaterThanZero'), 'error');
      return;
    }

    try {
      const data = {
        date: formData.date,
        itemName: formData.itemName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        rate: parseFloat(formData.rate),
        supplier: formData.supplier,
      };

      if (purchase) {
        await updatePurchase({ id: purchase._id, ...data }).unwrap();
        showToast(t('purchaseUpdated'), 'success');
      } else {
        await createPurchase(data).unwrap();
        showToast(t('purchaseCreated'), 'success');
      }
      onSuccess();
    } catch (error) {
      showToast(error.data?.message || t('failedToSave'), 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={purchase ? t('editPurchase') : t('newPurchase')}
      onSubmit={handleSubmit}
      submitText={purchase ? t('save') : t('add')}
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
            <TextField
              fullWidth
              label={t('itemName')}
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
            />
          </Grid>
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
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('unit')}
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="pcs, kg, etc."
              required
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
              <InputLabel>{t('supplier')}</InputLabel>
              <Select
                value={formData.supplier}
                label={t('supplier')}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier.name}>
                    {supplier.name} {supplier.city && `- ${supplier.city}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body1">
                <strong>{t('totalAmount')}: ₹{calculateTotal()}</strong>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}

export default PurchaseModal;
