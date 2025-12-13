import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  IconButton,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import DataTable from "../components/common/DataTable";
import SupplierModal from "../components/Supplier/SupplierModal";
import {
  useGetSuppliersQuery,
  useDeleteSupplierMutation,
} from "../store/api/supplierApi";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "../hooks/useTranslation";

function SupplierPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const { showToast } = useToast();
  const { data, isLoading, refetch } = useGetSuppliersQuery({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });
  const [deleteSupplier] = useDeleteSupplierMutation();

  const handleOpenModal = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("deleteSupplierConfirm"))) {
      try {
        await deleteSupplier(id).unwrap();
        showToast(t("supplierDeleted"), "success");
        refetch();
      } catch (error) {
        showToast(error.data?.message || t("failedToDelete"), "error");
      }
    }
  };

  const totalSuppliers = data?.total || 0;

  const columns = [
    { id: "name", label: t("name") },
    { id: "email", label: t("email") },
    { id: "phone", label: t("phone") },
    { id: "city", label: t("city") },
    { id: "state", label: t("state") },
  ];

  const rows = (data?.suppliers || []).map((supplier) => ({
    id: supplier._id,
    name: supplier.name,
    email: supplier.email || "-",
    phone: supplier.phone || "-",
    city: supplier.city || "-",
    state: supplier.state || "-",
    original: supplier,
  }));

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 1, fontSize: "2rem" }}
          >
            {t("supplierTitle")}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: "1.125rem" }}
          >
            {t("supplierSubtitle")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          size="large"
        >
          {t("addSupplier")}
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: "#667eea", color: "white" }}>
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
                    {t("totalSuppliers")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, fontSize: "2.5rem" }}
                  >
                    {totalSuppliers}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder={t("searchSupplier")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper" } }}
          />
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={isLoading}
        renderActions={(row) => (
          <Box>
            <IconButton
              size="small"
              onClick={() => handleEdit(row.original)}
              sx={{
                mr: 1,
                color: "primary.main",
                "&:hover": { bgcolor: "primary.light", color: "white" },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(row.id)}
              sx={{
                color: "error.main",
                "&:hover": { bgcolor: "error.light", color: "white" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      <SupplierModal
        open={modalOpen}
        onClose={handleCloseModal}
        supplier={editingSupplier}
        onSuccess={() => {
          handleCloseModal();
          refetch();
        }}
      />
    </Box>
  );
}

export default SupplierPage;
