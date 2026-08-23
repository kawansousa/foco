import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LoginInput, RegisterInput, Settings, UpdateMeInput, User } from "@foco/shared";
import { ApiError } from "@foco/shared";
import { api, tokenStore } from "./api";
import { cancelFoReminders } from "./notifications";

type AuthState = {
  ready: boolean;
  user: User | null;
  settings: Settings | null;
  /** troféus conquistados (para o chip de perfil) */
  trophyCount: number;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setSettings: (s: Settings) => void;
  refresh: () => Promise<void>;
  updateProfile: (input: UpdateMeInput) => Promise<void>;
  /** soma troféus recém-conquistados sem precisar ir à rede */
  addTrophies: (n: number) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [trophyCount, setTrophyCount] = useState(0);

  const refresh = useCallback(async () => {
    const token = await tokenStore.get();
    if (!token) {
      setUser(null);
      setSettings(null);
      return;
    }
    try {
      const me = await api.auth.me();
      setUser(me.user);
      setSettings(me.settings);
      setTrophyCount(me.trophyCount);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await tokenStore.set(null);
        setUser(null);
        setSettings(null);
      }
      // sem rede: mantém o que tinha
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.auth.login(input);
    await tokenStore.set(res.token);
    setUser(res.user);
    setSettings(res.settings);
    setTrophyCount(res.trophyCount);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.auth.register(input);
    await tokenStore.set(res.token);
    setUser(res.user);
    setSettings(res.settings);
    setTrophyCount(res.trophyCount);
  }, []);

  const logout = useCallback(async () => {
    await tokenStore.set(null);
    await cancelFoReminders();
    setUser(null);
    setSettings(null);
    setTrophyCount(0);
  }, []);

  const updateProfile = useCallback(async (input: UpdateMeInput) => {
    const me = await api.auth.updateMe(input);
    setUser(me.user);
    setSettings(me.settings);
    setTrophyCount(me.trophyCount);
  }, []);

  const addTrophies = useCallback((n: number) => {
    if (n > 0) setTrophyCount((c) => c + n);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      settings,
      trophyCount,
      login,
      register,
      logout,
      setSettings,
      refresh,
      updateProfile,
      addTrophies,
    }),
    [ready, user, settings, trophyCount, login, register, logout, refresh, updateProfile, addTrophies],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
