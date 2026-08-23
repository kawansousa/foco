import { createFocoClient } from "@foco/shared";

/** URL da API do Foco (apps/api). Defina NEXT_PUBLIC_API_URL no .env.local. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export const api = createFocoClient({ baseUrl: API_URL });
