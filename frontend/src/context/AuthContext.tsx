import React, { createContext, useContext, useState, useEffect } from "react";
import { api, type User } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; address?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string; address?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("techhub_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem("techhub_token");
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            setUser(res.data);
          }
        } catch (err: unknown) {
          console.warn("Token expired or invalid:", err);
          localStorage.removeItem("techhub_token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem("techhub_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; address?: string }) => {
    const res = await api.register(data);
    if (res.success && res.data) {
      localStorage.setItem("techhub_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem("techhub_token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string; address?: string }) => {
    const res = await api.updateProfile(data);
    if (res.success && res.data) {
      setUser(res.data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
