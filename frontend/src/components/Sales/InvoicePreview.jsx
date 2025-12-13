import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Paper,
  Grid,
  IconButton,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "../../hooks/useTranslation";
import dayjs from "dayjs";

function InvoicePreview({ open, onClose, sale, customer }) {
  const { t } = useTranslation();

  const handlePrint = () => {
    window.print();
  };

  if (!sale) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          "@media print": {
            borderRadius: 0,
            boxShadow: "none",
            margin: 0,
            maxWidth: "100%",
          },
        },
      }}
    >
      <Box sx={{ "@media print": { display: "none" } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid rgba(0,0,0,0.12)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.5rem" }}>
            {t("invoicePreview")}
          </Typography>
          <Box>
            <IconButton onClick={handlePrint} color="primary" sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Paper
          sx={{
            p: 4,
            "@media print": {
              p: 3,
              boxShadow: "none",
            },
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: "2rem",
                color: "#667eea",
              }}
            >
              {t("shopName")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: "1.125rem", color: "text.secondary" }}
            >
              {t("manufacturingUnit")}
            </Typography>
            {customer?.address && (
              <Typography
                variant="body2"
                sx={{ mt: 1, fontSize: "1rem", color: "text.secondary" }}
              >
                {customer.address}
                {customer.city && `, ${customer.city}`}
                {customer.state && `, ${customer.state}`}
                {customer.pincode && ` - ${customer.pincode}`}
              </Typography>
            )}
            {customer?.phone && (
              <Typography
                variant="body2"
                sx={{ fontSize: "1rem", color: "text.secondary" }}
              >
                {t("phone")}: {customer.phone}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Invoice Details */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 1, fontSize: "1rem" }}
              >
                {t("billTo")}:
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, fontSize: "1.125rem" }}
              >
                {sale.customer}
              </Typography>
              {customer && (
                <>
                  {customer.address && (
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "1rem", color: "text.secondary" }}
                    >
                      {customer.address}
                    </Typography>
                  )}
                  {customer.city && customer.state && (
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "1rem", color: "text.secondary" }}
                    >
                      {customer.city}, {customer.state}
                      {customer.pincode && ` - ${customer.pincode}`}
                    </Typography>
                  )}
                  {customer.phone && (
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "1rem", color: "text.secondary" }}
                    >
                      {t("phone")}: {customer.phone}
                    </Typography>
                  )}
                  {customer.gstin && (
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "1rem", color: "text.secondary" }}
                    >
                      {t("gstin")}: {customer.gstin}
                    </Typography>
                  )}
                </>
              )}
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{ textAlign: { xs: "left", md: "right" } }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mb: 2, fontSize: "1.75rem" }}
              >
                {t("invoice")} #{sale._id.slice(-8).toUpperCase()}
              </Typography>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 1, fontSize: "1rem" }}
                >
                  {t("date")}:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, fontSize: "1.125rem" }}
                >
                  {dayjs(sale.date).format("DD/MM/YYYY")}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Items Table */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                gap: 2,
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 1,
                mb: 1,
                fontWeight: 600,
                fontSize: "1.125rem",
              }}
            >
              <Typography>{t("itemName")}</Typography>
              <Typography align="right">{t("quantity")}</Typography>
              <Typography align="right">{t("rate")}</Typography>
              <Typography align="right">{t("subtotal")}</Typography>
              <Typography align="right">{t("total")}</Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                gap: 2,
                p: 2,
                borderBottom: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              <Typography sx={{ fontSize: "1.125rem" }}>
                {sale.itemName}
              </Typography>
              <Typography align="right" sx={{ fontSize: "1.125rem" }}>
                {sale.quantity}
              </Typography>
              <Typography align="right" sx={{ fontSize: "1.125rem" }}>
                ₹{sale.rate.toFixed(2)}
              </Typography>
              <Typography align="right" sx={{ fontSize: "1.125rem" }}>
                ₹{(sale.subtotal || sale.quantity * sale.rate).toFixed(2)}
              </Typography>
              <Typography
                align="right"
                sx={{ fontSize: "1.125rem", fontWeight: 600 }}
              >
                ₹{sale.total.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {/* Totals */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Box sx={{ minWidth: 300 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  fontSize: "1.125rem",
                }}
              >
                <Typography>{t("subtotal")}:</Typography>
                <Typography>
                  ₹{(sale.subtotal || sale.quantity * sale.rate).toFixed(2)}
                </Typography>
              </Box>
              {sale.discount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    fontSize: "1.125rem",
                    color: "error.main",
                  }}
                >
                  <Typography>
                    {t("discount")} (
                    {sale.discountType === "percentage" ? "%" : "₹"}):
                  </Typography>
                  <Typography>-₹{sale.discount.toFixed(2)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                <Typography>{t("total")}:</Typography>
                <Typography>₹{sale.total.toFixed(2)}</Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  fontSize: "1.125rem",
                }}
              >
                <Typography>{t("paidAmount")}:</Typography>
                <Typography>₹{(sale.paidAmount || 0).toFixed(2)}</Typography>
              </Box>
              {sale.outstandingAmount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "error.main",
                  }}
                >
                  <Typography>{t("outstandingAmount")}:</Typography>
                  <Typography>₹{sale.outstandingAmount.toFixed(2)}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Payment Status */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body1"
              sx={{ mb: 1, fontSize: "1.125rem", fontWeight: 600 }}
            >
              {t("paymentStatus")}:{" "}
              <span
                style={{
                  color:
                    sale.paymentStatus === "paid"
                      ? "#10b981"
                      : sale.paymentStatus === "partial"
                      ? "#f59e0b"
                      : "#ef4444",
                  textTransform: "capitalize",
                }}
              >
                {t(sale.paymentStatus || "unpaid")}
              </span>
            </Typography>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography
              variant="body2"
              sx={{ fontSize: "1rem", color: "text.secondary" }}
            >
              {t("thankYouMessage")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1, fontSize: "1rem", color: "text.secondary" }}
            >
              {t("termsAndConditions")}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, "@media print": { display: "none" } }}>
        <Button onClick={onClose} variant="outlined" sx={{ minWidth: 120 }}>
          {t("close")}
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          sx={{ minWidth: 120 }}
        >
          {t("print")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InvoicePreview;
