"use client";

import { createContext, useState, useEffect, useContext, useRef, ReactNode, startTransition } from "react";
import { useRouter } from "next/navigation";
import { parseCookies, setCookie, destroyCookie } from "nookies";
import { AuthContextType, User } from "@/types/auth";
import { URL_API, AxiosAdapter } from "@/infra/AxiosAdapter";
import { deleteAuthToken } from "@/utils/cookies";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const authChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const { token } = parseCookies();
    setUser(token ? { token } : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const changed = () => {
      if (loading) return;
      if (/^\/(dashboard|superadmin|gestao|cadastro|territories|balanco)(\/|$)/.test(window.location.pathname) && parseCookies().token !== user?.token) window.location.reload();
    };
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("admin-auth") : null;
    authChannel.current = channel;
    channel?.addEventListener("message", changed);
    window.addEventListener("focus", changed);
    return () => { channel?.close(); if (authChannel.current === channel) authChannel.current = null; window.removeEventListener("focus", changed); };
  }, [user?.token, loading]);

  const replaceToken = (token: string) => {
    setCookie(null, "token", token, { maxAge: 60 * 60 * 24, path: "/" });
    setUser({ token });
    authChannel.current?.postMessage("changed");
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${URL_API}/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
      replaceToken(data.token);

      startTransition(() => {
        router.push(jwtDecode<DecodedToken>(data.token).roles?.includes("super_admin") ? "/superadmin" : "/dashboard");
      });
    } else {
      alert("Login falhou!");
    }
  };

  const logout = async () => {
    destroyCookie(null, "token");
    setUser(null);
    await deleteAuthToken();
    router.push("/login");
  };

  const forgotPassword = async (email: string) => {
    const axios = new AxiosAdapter();
    const response = await axios.post("forgot-password", { email });
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(response.message || "Erro ao solicitar recuperação de senha");
    }
  };

  const resetPassword = async (password: string, token: string) => {
    const axios = new AxiosAdapter();
    const response = await axios.post("reset-password", { password, token });
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(response.message || "Erro ao redefinir senha");
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, replaceToken, forgotPassword, resetPassword }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
