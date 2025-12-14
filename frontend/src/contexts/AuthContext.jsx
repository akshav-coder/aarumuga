import React, { createContext, useState, useContext, useEffect } from "react";
import { useGetCurrentUserQuery } from "../store/api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { data: userData, isLoading, error } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (userData) {
      setUser(userData);
      setLoading(false);
    } else if (error && token) {
      // Token is invalid, clear it
      setToken(null);
      setUser(null);
      setLoading(false);
    } else if (!token) {
      setLoading(false);
    }
  }, [userData, isLoading, error, token]);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    isManager: user?.role === "manager" || user?.role === "admin",
    isEmployee: user?.role === "employee" || user?.role === "manager" || user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

