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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import LanguageSwitcher from "../common/LanguageSwitcher";

const drawerWidth = 240;

function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const menuItems = [
    { text: getTranslation(language, "dashboard"), icon: <DashboardIcon />, path: "/dashboard" },
    { text: getTranslation(language, "purchases"), icon: <ShoppingCartIcon />, path: "/purchases" },
    { text: getTranslation(language, "sales"), icon: <PointOfSaleIcon />, path: "/sales" },
    { text: getTranslation(language, "stock"), icon: <InventoryIcon />, path: "/stock" },
    { text: getTranslation(language, "customers"), icon: <PeopleIcon />, path: "/customers" },
    { text: getTranslation(language, "suppliers"), icon: <BusinessIcon />, path: "/suppliers" },
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

  const drawer = (
    <Box sx={{ height: "100%" }}>
      <List sx={{ pt: 2 }}>
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
            sx={{ fontWeight: 600, flexGrow: 1, fontSize: '1.25rem' }}
          >
            Aarumuga - Manufacturing Management System
          </Typography>
          <LanguageSwitcher />
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
