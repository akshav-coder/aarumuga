import { useState, useEffect } from "react";
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
} from "@mui/material";
import Modal from "../common/Modal";
import InvoicePreview from "./InvoicePreview";
import {
  useCreateSaleMutation,
  useUpdateSaleMutation,
} from "../../store/api/salesApi";
import { useGetStockQuery } from "../../store/api/stockApi";
import { useGetCustomersQuery } from "../../store/api/customerApi";
import { useToast } from "../common/ToastProvider";
import { useTranslation } from "../../hooks/useTranslation";
import {
  formatIndianNumber,
  parseFormattedNumber,
  formatIndianCurrency,
} from "../../utils/numberFormat";
import dayjs from "dayjs";

function SalesModal({ open, onClose, sale, onSuccess }) {
  const { t } = useTranslation();
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdSale, setCreatedSale] = useState(null);
  const [formData, setFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    quantity: "",
    rate: "",
    customer: "",
    discount: "",
    discountType: "fixed",
    paidAmount: "",
    paymentMethod: "cash",
  });

  const { showToast } = useToast();
  const [createSale] = useCreateSaleMutation();
  const [updateSale] = useUpdateSaleMutation();

  const { data: stockData } = useGetStockQuery();
  const { data: customersData } = useGetCustomersQuery({ limit: 1000 });
  const availableStock = stockData?.stock?.[0] || null;
  const customers = customersData?.customers || [];

  useEffect(() => {
    if (sale) {
      setFormData({
        date: dayjs(sale.date).format("YYYY-MM-DD"),
        quantity: sale.quantity ? formatIndianNumber(sale.quantity) : "",
        rate: sale.rate ? formatIndianNumber(sale.rate) : "",
        customer: sale.customer || "",
        discount: sale.discount ? formatIndianNumber(sale.discount) : "",
        discountType: sale.discountType || "fixed",
        paidAmount: sale.paidAmount ? formatIndianNumber(sale.paidAmount) : "",
        paymentMethod: sale.paymentMethod || "cash",
      });
    } else {
      setFormData({
        date: dayjs().format("YYYY-MM-DD"),
        quantity: "",
        rate: "",
        customer: "",
        discount: "",
        discountType: "fixed",
        paidAmount: "",
        paymentMethod: "cash",
      });
    }
  }, [sale, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format numeric fields with Indian number formatting
    if (
      name === "quantity" ||
      name === "rate" ||
      name === "discount" ||
      name === "paidAmount"
    ) {
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

  const calculateSubtotal = () => {
    const qty = parseFloat(parseFormattedNumber(formData.quantity)) || 0;
    const rate = parseFloat(parseFormattedNumber(formData.rate)) || 0;
    return qty * rate;
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(parseFormattedNumber(formData.discount)) || 0;
    if (discount <= 0) return 0;

    if (formData.discountType === "percentage") {
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
    const quantity = parseFormattedNumber(formData.quantity);
    const rate = parseFormattedNumber(formData.rate);

    if (!quantity || !rate || !formData.customer) {
      showToast(t("fillAllFields"), "error");
      return;
    }

    const qtyNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);

    if (qtyNum <= 0 || rateNum <= 0) {
      showToast(t("quantityRateGreaterThanZero"), "error");
      return;
    }

    if (!sale && availableStock && availableStock.quantity < qtyNum) {
      showToast(
        `${t("insufficientStock")}. ${t(
          "availableStock"
        )}: ${formatIndianNumber(availableStock.quantity)} kg`,
        "error"
      );
      return;
    }

    try {
      const data = {
        date: formData.date,
        quantity: qtyNum,
        rate: rateNum,
        customer: formData.customer,
        discount: parseFloat(parseFormattedNumber(formData.discount)) || 0,
        discountType: formData.discountType,
        paidAmount: parseFloat(parseFormattedNumber(formData.paidAmount)) || 0,
        paymentMethod: formData.paymentMethod,
      };

      if (sale) {
        await updateSale({ id: sale._id, ...data }).unwrap();
        showToast(t("saleUpdated"), "success");
        onSuccess();
      } else {
        const result = await createSale(data).unwrap();
        showToast(t("saleCreated"), "success");
        setCreatedSale(result);
        setShowInvoice(true);
        // Don't call onSuccess yet, wait for invoice to close
      }
    } catch (error) {
      showToast(error.data?.message || t("failedToSave"), "error");
    }
  };

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
        title={sale ? t("editSale") : t("newSale")}
        onSubmit={handleSubmit}
        submitText={sale ? t("save") : t("add")}
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
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t("itemName")}: Tamarind Paste
                </Typography>
                {availableStock && (
                  <Typography variant="body2">
                    {t("availableStock")}:{" "}
                    {formatIndianNumber(availableStock.quantity)} kg
                  </Typography>
                )}
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("quantity")}
                name="quantity"
                type="text"
                value={formData.quantity}
                onChange={handleChange}
                required
                error={
                  availableStock &&
                  parseFloat(parseFormattedNumber(formData.quantity)) >
                    availableStock.quantity &&
                  !sale
                }
                helperText={
                  availableStock &&
                  parseFloat(parseFormattedNumber(formData.quantity)) >
                    availableStock.quantity &&
                  !sale
                    ? `${t("cannotExceedStock")} (${formatIndianNumber(
                        availableStock.quantity
                      )} kg)`
                    : availableStock
                    ? `${t("availableStock")}: ${formatIndianNumber(
                        availableStock.quantity
                      )} kg`
                    : ""
                }
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
                <InputLabel>{t("customer")}</InputLabel>
                <Select
                  value={formData.customer}
                  label={t("customer")}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
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
                <InputLabel>{t("discountType")}</InputLabel>
                <Select
                  value={formData.discountType}
                  label={t("discountType")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value,
                      discount: "",
                    })
                  }
                >
                  <MenuItem value="fixed">{t("discountFixed")}</MenuItem>
                  <MenuItem value="percentage">
                    {t("discountPercentage")}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t("discount")}
                name="discount"
                type="text"
                value={formData.discount}
                onChange={handleChange}
                helperText={
                  formData.discountType === "percentage"
                    ? "Enter percentage (e.g., 10 for 10%)"
                    : "Enter fixed amount"
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>
                    {t("subtotal")}: {formatIndianCurrency(calculateSubtotal())}
                  </strong>
                </Typography>
                {calculateDiscount() > 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {t("discount")}: -
                    {formatIndianCurrency(calculateDiscount())}
                  </Typography>
                )}
                <Typography variant="h6">
                  <strong>
                    {t("total")}: {formatIndianCurrency(calculateTotal())}
                  </strong>
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t("paidAmount")}
                name="paidAmount"
                type="text"
                value={formData.paidAmount}
                onChange={handleChange}
                helperText={`${t("outstandingAmount")}: ${formatIndianCurrency(
                  parseFloat(calculateTotal()) -
                    (parseFloat(parseFormattedNumber(formData.paidAmount)) || 0)
                )}`}
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
