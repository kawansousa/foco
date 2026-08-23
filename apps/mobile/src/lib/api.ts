import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createFocoClient } from "@foco/shared";

const TOKEN_KEY = "foco.token";
const API_PORT = 4000;

/**
 * Descobre a URL da API:
 * 1. EXPO_PUBLIC_API_URL (arquivo .env)
 * 2. o mesmo host do Metro (funciona no celular físico na mesma rede Wi-Fi)
 * 3. localhost (simulador / web)
 */
export function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") return `http://${host}:${API_PORT}`;
  }
  // emulador Android não enxerga "localhost" do host
  if (Platform.OS === "android") return `http://10.0.2.2:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();

let memoryToken: string | null = null;

export const tokenStore = {
  async get(): Promise<string | null> {
    if (memoryToken) return memoryToken;
    try {
      if (Platform.OS === "web") {
        memoryToken = globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
      } else {
        memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch {
      memoryToken = null;
    }
    return memoryToken;
  },
  async set(token: string | null) {
    memoryToken = token;
    try {
      if (Platform.OS === "web") {
        if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
        else globalThis.localStorage?.removeItem(TOKEN_KEY);
      } else if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      /* storage indisponível: fica só em memória */
    }
  },
};

export const api = createFocoClient({ baseUrl: API_URL, getToken: () => tokenStore.get() });
