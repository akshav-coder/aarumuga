import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Chip,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import { useTranslation } from "../../hooks/useTranslation";

function DataTable({
  columns,
  rows,
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  renderActions,
  onRowClick,
  rowStyle,
}) {
  const { t } = useTranslation();

  const handleChangePage = (event, newPage) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            sx={{ mb: 1, borderRadius: 2 }}
          />
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={56}
              sx={{ mb: 1, borderRadius: 2 }}
            />
          ))}
        </Box>
      </Paper>
    );
  }

  if (rows.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <InboxIcon
          sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }}
        />
        <Typography
          variant="h5"
          color="text.secondary"
          gutterBottom
          sx={{ fontSize: "1.5rem" }}
        >
          {t("noDataAvailable")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.125rem" }}
        >
          {t("startByAdding")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: "hidden" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  sx={{
                    fontSize: "1.125rem", // 18px
                    fontWeight: 700,
                    color: "#1a1a1a",
                    backgroundColor: "#f8f9fa",
                    borderBottom: "2px solid #dee2e6",
                    py: 2.5,
                    width: column.width || "auto",
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {renderActions && (
                <TableCell
                  align="right"
                  sx={{
                    fontSize: "1.125rem", // 18px
                    fontWeight: 700,
                    color: "#1a1a1a",
                    backgroundColor: "#f8f9fa",
                    borderBottom: "2px solid #dee2e6",
                    py: 2.5,
                  }}
                >
                  {t("actions")}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.id}
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  "&:nth-of-type(even)": {
                    backgroundColor: "rgba(0, 0, 0, 0.02)",
                  },
                  ...(onRowClick && { cursor: "pointer" }),
                  ...(rowStyle && rowStyle(row)),
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || "left"}
                    sx={{ py: 2 }}
                  >
                    {row[column.id]}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell align="right" sx={{ py: 2 }}>
                    {renderActions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderTop: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      />
    </Paper>
  );
}

export default DataTable;
