import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslation } from "../../utils/translations";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import PaymentIcon from "@mui/icons-material/Payment";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useAuth } from "../../contexts/AuthContext";

const drawerWidth = 240;

function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user, logout, loading: authLoading } = useAuth();

  // Debug: Log user state
  if (import.meta.env.DEV) {
    console.log("Layout - User:", user, "Loading:", authLoading);
  }

  const menuItems = [
    {
      text: getTranslation(language, "dashboard"),
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: getTranslation(language, "purchases"),
      icon: <ShoppingCartIcon />,
      path: "/purchases",
    },
    {
      text: getTranslation(language, "sales"),
      icon: <PointOfSaleIcon />,
      path: "/sales",
    },
    {
      text: getTranslation(language, "stock"),
      icon: <InventoryIcon />,
      path: "/stock",
    },
    {
      text: getTranslation(language, "customers"),
      icon: <PeopleIcon />,
      path: "/customers",
    },
    {
      text: getTranslation(language, "suppliers"),
      icon: <BusinessIcon />,
      path: "/suppliers",
    },
    {
      text: getTranslation(language, "payments"),
      icon: <PaymentIcon />,
      path: "/payments",
    },
    {
      text: getTranslation(language, "supplierPayments"),
      icon: <PaymentIcon />,
      path: "/supplier-payments",
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate("/login");
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "manager":
        return "warning";
      case "employee":
        return "info";
      default:
        return "default";
    }
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <List sx={{ pt: 2, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": {
                  background: "#667eea",
                  color: "white",
                  "&:hover": {
                    background: "#5a67d8",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? "white"
                      : "text.secondary",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {user && (
        <>
          <Divider />
          <List sx={{ pb: 2 }}>
            <ListItem disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  color: "error.main",
                  "&:hover": {
                    backgroundColor: "rgba(211, 47, 47, 0.1)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "error.main" }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                  primary={getTranslation(language, "logout")}
                  primaryTypographyProps={{
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Full-width header */}
      <AppBar
        position="fixed"
        sx={{
          width: "100%",
          background: "#667eea",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontWeight: 600, flexGrow: 1, fontSize: "1.25rem" }}
          >
            {getTranslation(language, "shopName")} -{" "}
            {getTranslation(language, "shopManagementSystem")}
          </Typography>
          <LanguageSwitcher />
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
              <Chip
                label={getTranslation(language, user.role) || user.role}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ fontSize: "0.875rem", fontWeight: 600 }}
              />
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{ color: "white" }}
                size="small"
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "rgba(255,255,255,0.2)",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <MenuItem disabled sx={{ fontSize: "1rem" }}>
                  <AccountCircleIcon sx={{ mr: 1 }} />
                  {user.name}
                </MenuItem>
                <MenuItem
                  disabled
                  sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                >
                  {user.email}
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ fontSize: "1rem" }}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  {getTranslation(language, "logout")}
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main content area with sidebar */}
      <Box sx={{ display: "flex", flexGrow: 1, mt: 8 }}>
        {/* Sidebar navigation */}
        <Box
          component="nav"
          sx={{
            width: { md: drawerWidth },
            flexShrink: { md: 0 },
            position: { md: "fixed" },
            height: { md: `calc(100vh - 64px)` },
            top: { md: 64 },
            left: 0,
            borderRight: { md: "1px solid rgba(0, 0, 0, 0.12)" },
            bgcolor: { md: "background.paper" },
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                top: 64,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                border: "none",
                top: 64,
                height: "calc(100vh - 64px)",
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
