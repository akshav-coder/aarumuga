import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
} from '@mui/material';
import Modal from '../common/Modal';
import { useCreateSupplierMutation, useUpdateSupplierMutation } from '../../store/api/supplierApi';
import { useToast } from '../common/ToastProvider';
import { useTranslation } from '../../hooks/useTranslation';

function SupplierModal({ open, onClose, supplier, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
  });

  const { showToast } = useToast();
  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        pincode: supplier.pincode || '',
        gstin: supplier.gstin || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
      });
    }
  }, [supplier, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showToast(`${t('name')} ${t('required').toLowerCase()}`, 'error');
      return;
    }

    try {
      if (supplier) {
        await updateSupplier({ id: supplier._id, ...formData }).unwrap();
        showToast(t('supplierUpdated'), 'success');
      } else {
        await createSupplier(formData).unwrap();
        showToast(t('supplierCreated'), 'success');
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
      title={supplier ? t('editSupplier') : t('newSupplier')}
      onSubmit={handleSubmit}
      submitText={supplier ? t('save') : t('add')}
    >
      <Box sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('name')}
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('phone')}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('gstin')}
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              inputProps={{ maxLength: 15 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('address')}
              name="address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('city')}
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('state')}
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('pincode')}
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}

export default SupplierModal;

