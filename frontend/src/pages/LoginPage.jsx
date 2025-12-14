import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import { useLoginMutation } from "../store/api/authApi";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/common/ToastProvider";
import { useTranslation } from "../hooks/useTranslation";

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setAuth, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError(t("fillAllFields"));
      return;
    }

    try {
      const result = await login(formData).unwrap();
      setAuth(result.token, result.user);
      showToast(t("loginSuccess"), "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.data?.message || t("loginFailed"));
      showToast(err.data?.message || t("loginFailed"), "error");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 450, width: "100%", borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 1, fontSize: "2rem", color: "#667eea" }}
            >
              {t("shopName")}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "1.125rem", color: "text.secondary" }}>
              {t("loginToContinue")}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, fontSize: "1rem" }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t("email")}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              autoComplete="email"
              inputProps={{ fontSize: "1.125rem" }}
            />

            <TextField
              fullWidth
              label={t("password")}
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ fontSize: "1.5rem" }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{ fontSize: "1.125rem" }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={<LoginIcon />}
              sx={{
                py: 1.5,
                fontSize: "1.125rem",
                fontWeight: 600,
                background: "#667eea",
                "&:hover": {
                  background: "#4f46e5",
                },
              }}
            >
              {isLoading ? t("loggingIn") : t("login")}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontSize: "1rem", color: "text.secondary" }}>
              {t("defaultCredentials")}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 1 }}>
              Email: admin@aarumuga.com
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Password: admin123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LoginPage;


