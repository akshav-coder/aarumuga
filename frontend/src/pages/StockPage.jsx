import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  CircularProgress,
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import StockAdjustModal from "../components/Stock/StockAdjustModal";
import { useGetStockQuery } from "../store/api/stockApi";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";

function StockPage() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  const { data, isLoading, refetch } = useGetStockQuery();

  const handleOpenModal = (stock) => {
    setEditingStock(stock);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStock(null);
  };

  const stock = data?.stock?.[0] || null;
  // Always use "kg" for Tamarind Paste
  const stockUnit = stock?.unit || "kg";
  const isLow = stock ? stock.quantity <= stock.lowStockThreshold : false;

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 1, fontSize: "2rem" }}
        >
          {t("stockTitle")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.125rem" }}
        >
          {t("stockSubtitle")}
        </Typography>
      </Box>

      {stock && (
      <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{ background: isLow ? "#f5576c" : "#667eea", color: "white" }}
            >
            <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        opacity: 0.9,
                        mb: 1.5,
                        fontSize: "1.125rem",
                        fontWeight: 500,
                      }}
                    >
                      {stock.itemName}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 700, fontSize: "2.5rem", mb: 1 }}
                    >
                      {stock.quantity} kg
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {t("lastUpdated")}:{" "}
                      {dayjs(stock.lastUpdated).format("DD/MM/YYYY HH:mm")}
                  </Typography>
                    {isLow && (
                      <Chip
                        label={t("lowStock")}
                        color="error"
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                        }}
                      />
                    )}
                </Box>
                  <InventoryIcon sx={{ fontSize: 60, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
          <Grid item xs={12} md={6}>
            <Card>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {t("stockDetails")}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("lowStockThreshold")}
                  </Typography>
                  <Typography variant="h6">
                    {stock.lowStockThreshold} kg
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleOpenModal(stock)}
                  size="large"
                  sx={{ mt: 2 }}
                >
                  {t("adjustStock")}
                </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {isLoading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && !stock && (
        <Card>
        <CardContent>
            <Typography
              variant="body1"
              color="text.secondary"
              align="center"
              sx={{ py: 4 }}
            >
              {t("noDataAvailable")}
            </Typography>
        </CardContent>
      </Card>
        )}

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
