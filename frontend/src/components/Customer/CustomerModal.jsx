import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
} from '@mui/material';
import Modal from '../common/Modal';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../../store/api/customerApi';
import { useToast } from '../common/ToastProvider';
import { useTranslation } from '../../hooks/useTranslation';

function CustomerModal({ open, onClose, customer, onSuccess }) {
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
  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        gstin: customer.gstin || '',
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
  }, [customer, open]);

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
      if (customer) {
        await updateCustomer({ id: customer._id, ...formData }).unwrap();
        showToast(t('customerUpdated'), 'success');
      } else {
        await createCustomer(formData).unwrap();
        showToast(t('customerCreated'), 'success');
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
      title={customer ? t('editCustomer') : t('newCustomer')}
      onSubmit={handleSubmit}
      submitText={customer ? t('save') : t('add')}
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

export default CustomerModal;

