import { useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import { useGetPurchasesQuery } from "../store/api/purchaseApi";
import { useGetSalesQuery } from "../store/api/salesApi";
import { useGetStockQuery } from "../store/api/stockApi";
import { useGetCustomersQuery } from "../store/api/customerApi";
import { useGetSuppliersQuery } from "../store/api/supplierApi";
import { useTranslation } from "../hooks/useTranslation";
import dayjs from "dayjs";

function DashboardPage() {
  const { t } = useTranslation();
  const { data: purchasesData } = useGetPurchasesQuery({ page: 1, limit: 5 });
  const { data: salesData } = useGetSalesQuery({ page: 1, limit: 5 });
  const { data: stockData } = useGetStockQuery({ limit: 1000 });
  const { data: customersData } = useGetCustomersQuery({ page: 1, limit: 1 });
  const { data: suppliersData } = useGetSuppliersQuery({ page: 1, limit: 1 });

  const stats = useMemo(() => {
    const totalPurchases = purchasesData?.total || 0;
    const totalSales = salesData?.total || 0;
    const totalStockItems = stockData?.total || 0;
    const totalCustomers = customersData?.total || 0;
    const totalSuppliers = suppliersData?.total || 0;

    const totalPurchaseAmount =
      purchasesData?.purchases?.reduce((sum, p) => sum + p.totalAmount, 0) || 0;

    const totalSalesAmount =
      salesData?.sales?.reduce((sum, s) => sum + s.total, 0) || 0;

    const lowStockItems =
      stockData?.stock?.filter(
        (item) => item.quantity <= item.lowStockThreshold
      ) || [];

    const profit = totalSalesAmount - totalPurchaseAmount;

    return {
      totalPurchases,
      totalSales,
      totalStockItems,
      totalCustomers,
      totalSuppliers,
      totalPurchaseAmount,
      totalSalesAmount,
      profit,
      lowStockItems: lowStockItems.length,
      lowStockItemsList: lowStockItems.slice(0, 5),
    };
  }, [purchasesData, salesData, stockData, customersData, suppliersData]);

  const recentPurchases = purchasesData?.purchases?.slice(0, 5) || [];
  const recentSales = salesData?.sales?.slice(0, 5) || [];

  return (
    <Box>
      <Box mb={4}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 1, fontSize: "2rem" }}
        >
          {t("dashboardTitle")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.125rem" }}
        >
          {t("dashboardSubtitle")}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#667eea",
              color: "white",
            }}
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
                    {t("totalPurchases")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {stats.totalPurchases}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ opacity: 0.8, mt: 1, fontSize: "1.125rem" }}
                  >
                    ₹
                    {stats.totalPurchaseAmount.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#f5576c",
              color: "white",
            }}
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
                    {t("totalSales")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {stats.totalSales}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ opacity: 0.8, mt: 1, fontSize: "1.125rem" }}
                  >
                    ₹
                    {stats.totalSalesAmount.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                </Box>
                <PointOfSaleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#4facfe",
              color: "white",
            }}
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
                    {t("profit")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    ₹
                    {stats.profit.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ opacity: 0.8, mt: 1, fontSize: "1.125rem" }}
                  >
                    {stats.profit >= 0 ? t("positive") : t("negative")}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#10b981",
              color: "white",
            }}
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
                    {t("stockItems")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {stats.totalStockItems}
                  </Typography>
                  {stats.lowStockItems > 0 && (
                    <Typography
                      variant="body1"
                      sx={{ opacity: 0.8, mt: 1, fontSize: "1.125rem" }}
                    >
                      {stats.lowStockItems} {t("lowStock").toLowerCase()}
                    </Typography>
                  )}
                </Box>
                <InventoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "1.125rem", fontWeight: 500 }}
                  >
                    {t("totalCustomers")}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, fontSize: "2rem" }}
                  >
                    {stats.totalCustomers}
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 32, color: "primary.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "1.125rem", fontWeight: 500 }}
                  >
                    {t("totalSuppliers")}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, fontSize: "2rem" }}
                  >
                    {stats.totalSuppliers}
                  </Typography>
                </Box>
                <ShoppingCartIcon
                  sx={{ fontSize: 32, color: "primary.main" }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "1.125rem", fontWeight: 500 }}
                  >
                    {t("lowStockItems")}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      fontSize: "2rem",
                      color:
                        stats.lowStockItems > 0 ? "error.main" : "success.main",
                    }}
                  >
                    {stats.lowStockItems}
                  </Typography>
                </Box>
                <WarningIcon
                  sx={{
                    fontSize: 32,
                    color:
                      stats.lowStockItems > 0 ? "error.main" : "text.secondary",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, fontSize: "1.125rem" }}
          icon={<WarningIcon />}
        >
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, mb: 1.5, fontSize: "1.25rem" }}
          >
            {t("lowStockAlert")}: {stats.lowStockItems} {t("lowStockMessage")}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 3 }}>
            {stats.lowStockItemsList.map((item) => (
              <li key={item.itemName} style={{ marginBottom: "8px" }}>
                <Typography variant="body1" sx={{ fontSize: "1.125rem" }}>
                  {item.itemName}: {item.quantity} {item.unit} (Threshold:{" "}
                  {item.lowStockThreshold})
                </Typography>
              </li>
            ))}
          </Box>
        </Alert>
      )}

      {/* Recent Transactions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, mb: 2, fontSize: "1.5rem" }}
              >
                {t("recentPurchases")}
              </Typography>
              {recentPurchases.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("date")}</TableCell>
                        <TableCell>{t("itemName")}</TableCell>
                        <TableCell align="right">{t("amount")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPurchases.map((purchase) => (
                        <TableRow key={purchase._id} hover>
                          <TableCell>
                            {dayjs(purchase.date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell>{purchase.itemName}</TableCell>
                          <TableCell align="right">
                            ₹{purchase.totalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center", fontSize: "1.125rem" }}
                >
                  {t("noRecentPurchases")}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, mb: 2, fontSize: "1.5rem" }}
              >
                {t("recentSales")}
              </Typography>
              {recentSales.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("date")}</TableCell>
                        <TableCell>{t("itemName")}</TableCell>
                        <TableCell align="right">{t("amount")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentSales.map((sale) => (
                        <TableRow key={sale._id} hover>
                          <TableCell>
                            {dayjs(sale.date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell>{sale.itemName}</TableCell>
                          <TableCell align="right">
                            ₹{sale.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ py: 2, textAlign: "center", fontSize: "1.125rem" }}
                >
                  {t("noRecentSales")}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
