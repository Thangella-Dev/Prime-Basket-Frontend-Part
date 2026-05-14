import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("pb_cart");
  localStorage.removeItem("pb_orders");
  localStorage.removeItem("pb_notifications");
  localStorage.removeItem("pb_saved_addresses");
  localStorage.removeItem("pb_demo_phone_users");
  localStorage.removeItem("refund_requests");
  localStorage.removeItem("pb_gift_cards");
  localStorage.removeItem("pb_active_tracking");
  localStorage.removeItem("pb_saved_cards");
  localStorage.removeItem("pb_order_reviews");
  localStorage.removeItem("pb_marked_orders");
  localStorage.removeItem("pb_refunds");
  localStorage.removeItem("pb_wishlist");
  localStorage.removeItem("wallet");
}

function readSession() {
  try {
    const token = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser || savedUser === "undefined" || savedUser === "null") {
      clearAuthStorage();
      return { isAuthenticated: false, user: null };
    }

    const parsed = JSON.parse(savedUser);
    if (parsed && typeof parsed === "object") {
      return { isAuthenticated: true, user: parsed };
    }

    clearAuthStorage();
    return { isAuthenticated: false, user: null };
  } catch {
    clearAuthStorage();
    return { isAuthenticated: false, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const { isAuthenticated, user } = session;

  const login = (userData, tokens) => {
    setSession({ isAuthenticated: true, user: userData });
    localStorage.setItem("user", JSON.stringify(userData));
    if (tokens?.accessToken) localStorage.setItem("accessToken", tokens.accessToken);
    if (tokens?.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
  };

  const logout = () => {
    setSession({ isAuthenticated: false, user: null });
    clearAuthStorage();
  };

  const updateUser = (userData) => {
    setSession((prev) => ({ ...prev, user: userData }));
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
