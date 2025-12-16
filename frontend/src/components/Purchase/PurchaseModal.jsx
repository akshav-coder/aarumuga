import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Grid,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import Modal from "../common/Modal";
import {
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
} from "../../store/api/purchaseApi";
import { useGetSuppliersQuery } from "../../store/api/supplierApi";
import { useToast } from "../common/ToastProvider";
import { useTranslation } from "../../hooks/useTranslation";
import {
  formatIndianNumber,
  parseFormattedNumber,
  formatIndianCurrency,
} from "../../utils/numberFormat";
import dayjs from "dayjs";

function PurchaseModal({ open, onClose, purchase, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    quantity: "",
    rate: "",
    supplier: "",
    paymentMethod: "cash",
  });

  const { showToast } = useToast();
  const [createPurchase] = useCreatePurchaseMutation();
  const [updatePurchase] = useUpdatePurchaseMutation();
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 1000 });
  const suppliers = suppliersData?.suppliers || [];

  useEffect(() => {
    if (purchase) {
      setFormData({
        date: dayjs(purchase.date).format("YYYY-MM-DD"),
        quantity: purchase.quantity
          ? formatIndianNumber(purchase.quantity)
          : "",
        rate: purchase.rate ? formatIndianNumber(purchase.rate) : "",
        supplier: purchase.supplier || "",
        paymentMethod: purchase.paymentMethod || "cash",
      });
    } else {
      setFormData({
        date: dayjs().format("YYYY-MM-DD"),
        quantity: "",
        rate: "",
        supplier: "",
        paymentMethod: "cash",
      });
    }
  }, [purchase, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format quantity and rate with Indian number formatting
    if (name === "quantity" || name === "rate") {
      const parsed = parseFormattedNumber(value);
      // Only allow numbers and decimal point
      if (parsed === "" || /^\d*\.?\d*$/.test(parsed)) {
        const formatted = parsed ? formatIndianNumber(parsed) : "";
        setFormData((prev) => ({ ...prev, [name]: formatted }));
      }
    } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateTotal = () => {
    const qty = parseFloat(parseFormattedNumber(formData.quantity)) || 0;
    const rate = parseFloat(parseFormattedNumber(formData.rate)) || 0;
    return (qty * rate).toFixed(2);
  };

  const handleSubmit = async () => {
    const quantity = parseFormattedNumber(formData.quantity);
    const rate = parseFormattedNumber(formData.rate);

    if (!quantity || !rate || !formData.supplier) {
      showToast(t("fillAllFields"), "error");
      return;
    }

    const qtyNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);

    if (qtyNum <= 0 || rateNum <= 0) {
      showToast(t("quantityRateGreaterThanZero"), "error");
      return;
    }

    try {
      const data = {
        date: formData.date,
        quantity: qtyNum,
        unit: "kg", // Always kg for Tamarind Paste
        rate: rateNum,
        supplier: formData.supplier,
        paymentMethod: formData.paymentMethod,
      };

      if (purchase) {
        await updatePurchase({ id: purchase._id, ...data }).unwrap();
        showToast(t("purchaseUpdated"), "success");
      } else {
        await createPurchase(data).unwrap();
        showToast(t("purchaseCreated"), "success");
      }
      onSuccess();
    } catch (error) {
      showToast(error.data?.message || t("failedToSave"), "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={purchase ? t("editPurchase") : t("newPurchase")}
      onSubmit={handleSubmit}
      submitText={purchase ? t("save") : t("add")}
    >
      <Box sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t("date")}
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t("itemName")}: Tamarind Paste
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("unit")}: kg
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t("quantity")}
              name="quantity"
              type="text"
              value={formData.quantity}
              onChange={handleChange}
              helperText={`${t("unit")}: kg`}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t("rate")}
              name="rate"
              type="text"
              value={formData.rate}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>{t("supplier")}</InputLabel>
              <Select
                value={formData.supplier}
                label={t("supplier")}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
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
            <FormControl fullWidth required>
              <InputLabel>{t("paymentMethod")}</InputLabel>
              <Select
                value={formData.paymentMethod}
                label={t("paymentMethod")}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              >
                <MenuItem value="cash">{t("cash")}</MenuItem>
                <MenuItem value="credit">{t("credit")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body1">
                <strong>
                  {t("totalAmount")}: {formatIndianCurrency(calculateTotal())}
                </strong>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}

export default PurchaseModal;
