import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Grid,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from "@mui/material";
import Modal from "../common/Modal";
import {
  useUpdateStockMutation,
  useAdjustStockMutation,
} from "../../store/api/stockApi";
import { useToast } from "../common/ToastProvider";
import { useTranslation } from "../../hooks/useTranslation";

function StockAdjustModal({ open, onClose, stock, onSuccess }) {
  const { t } = useTranslation();
  const [adjustmentType, setAdjustmentType] = useState("set");
  const [quantity, setQuantity] = useState("");
  const [adjustment, setAdjustment] = useState("");

  const { showToast } = useToast();
  const [updateStock] = useUpdateStockMutation();
  const [adjustStock] = useAdjustStockMutation();

  useEffect(() => {
    if (stock) {
      setQuantity(stock.quantity.toString());
      setAdjustment("");
    }
  }, [stock, open]);

  const handleSubmit = async () => {
    if (!stock) {
      showToast(t("noDataAvailable"), "error");
      return;
    }

    try {
      if (adjustmentType === "set") {
        const qty = parseFloat(quantity);
        if (qty < 0) {
          showToast(t("quantityCannotBeNegative"), "error");
          return;
        }
        await updateStock({
          itemName: stock.itemName,
          quantity: qty,
        }).unwrap();
        showToast(t("purchaseUpdated"), "success");
      } else {
        const adj = parseFloat(adjustment);
        if (adj === 0) {
          showToast(t("adjustmentCannotBeZero"), "error");
          return;
        }
        await adjustStock({
          itemName: stock.itemName,
          adjustment: adj,
        }).unwrap();
        showToast(
          `${t("stock")} ${adj > 0 ? "increased" : "decreased"} by ${Math.abs(
            adj
          )}`,
          "success"
        );
      }
      onSuccess();
    } catch (error) {
      showToast(error.data?.message || t("failedToSave"), "error");
    }
  };

  if (!stock) return null;

  const newQuantity =
    adjustmentType === "set"
      ? parseFloat(quantity) || 0
      : stock.quantity + (parseFloat(adjustment) || 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t("adjustStock")} - ${stock.itemName}`}
      onSubmit={handleSubmit}
      submitText={t("save")}
    >
      <Box sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("currentStock")}
              </Typography>
              <Typography variant="h6">
                {stock.quantity} {stock.unit}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">{t("adjustmentType")}</FormLabel>
              <RadioGroup
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                row
              >
                <FormControlLabel
                  value="set"
                  control={<Radio />}
                  label={t("setQuantity")}
                />
                <FormControlLabel
                  value="adjust"
                  control={<Radio />}
                  label={t("adjustAddSubtract")}
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {adjustmentType === "set" ? (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("newQuantity")}
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("adjustmentAmount")}
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                helperText={t("adjustmentHelper")}
                required
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: "primary.light", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t("newStockQuantity")}
              </Typography>
              <Typography variant="h6" color="primary.contrastText">
                {newQuantity >= 0 ? newQuantity.toFixed(2) : "Invalid"}{" "}
                {stock.unit}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}

export default StockAdjustModal;
