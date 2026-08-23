import type {
  CreateGoalInput,
  LoginInput,
  RegisterInput,
  UpdateGoalInput,
  UpdateSettingsInput,
  UpdateTrophyInput,
  UpsertCheckinInput,
  WaitlistInput,
} from "./schemas";
import type {
  ApiErrorBody,
  AuthResponse,
  CheckinResponse,
  EarnedTrophy,
  FoMessage,
  GoalDetail,
  GoalWithProgress,
  MeResponse,
  Settings,
  StatsResponse,
  TodayResponse,
  TrophyView,
} from "./types";
import type { ISODate } from "./dates";

export class ApiError extends Error {
  status: number;
  issues?: ApiErrorBody["issues"];
  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error ?? `Erro ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.issues = body?.issues;
  }
}

export type ClientOptions = {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  fetch?: typeof fetch;
};

/**
 * Cliente tipado da API do Foco. Usado pelo app mobile e pelo site.
 */
export function createFocoClient(opts: ClientOptions) {
  const base = opts.baseUrl.replace(/\/$/, "");
  const f = opts.fetch ?? fetch;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = opts.getToken ? await opts.getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await f(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : null;
    if (!res.ok) throw new ApiError(res.status, (json as ApiErrorBody) ?? null);
    return json as T;
  }

  const q = (params: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) s.set(k, v);
    const str = s.toString();
    return str ? `?${str}` : "";
  };

  return {
    health: () => request<{ ok: true; time: string }>("GET", "/health"),

    auth: {
      register: (input: RegisterInput) => request<AuthResponse>("POST", "/auth/register", input),
      login: (input: LoginInput) => request<AuthResponse>("POST", "/auth/login", input),
      me: () => request<MeResponse>("GET", "/me"),
    },

    goals: {
      list: (params: { date?: ISODate; status?: string } = {}) =>
        request<{ goals: GoalWithProgress[] }>("GET", `/goals${q(params)}`),
      get: (id: string, date?: ISODate) => request<GoalDetail>("GET", `/goals/${id}${q({ date })}`),
      create: (input: CreateGoalInput) => request<GoalWithProgress>("POST", "/goals", input),
      update: (id: string, input: UpdateGoalInput) => request<GoalWithProgress>("PATCH", `/goals/${id}`, input),
      complete: (id: string, date?: ISODate) =>
        request<{ goal: GoalWithProgress; newTrophies: EarnedTrophy[] }>("POST", `/goals/${id}/complete`, { date }),
      remove: (id: string) => request<void>("DELETE", `/goals/${id}`),
    },

    today: (date?: ISODate) => request<TodayResponse>("GET", `/today${q({ date })}`),

    checkins: {
      upsert: (input: UpsertCheckinInput) => request<CheckinResponse>("PUT", "/checkins", input),
      history: (params: { from?: ISODate; to?: ISODate; goalId?: string } = {}) =>
        request<{ checkins: CheckinResponse["checkin"][] }>("GET", `/checkins${q(params)}`),
    },

    trophies: {
      list: () => request<{ trophies: TrophyView[] }>("GET", "/trophies"),
      update: (id: string, input: UpdateTrophyInput) => request<EarnedTrophy>("PATCH", `/trophies/${id}`, input),
    },

    settings: {
      get: () => request<Settings>("GET", "/settings"),
      update: (input: UpdateSettingsInput) => request<Settings>("PUT", "/settings", input),
    },

    stats: (date?: ISODate) => request<StatsResponse>("GET", `/stats${q({ date })}`),

    fo: {
      schedule: (date?: ISODate) => request<{ date: ISODate; messages: FoMessage[] }>("GET", `/fo/schedule${q({ date })}`),
    },

    waitlist: {
      join: (input: WaitlistInput) => request<{ ok: true; alreadyJoined: boolean }>("POST", "/waitlist", input),
    },
  };
}

export type FocoClient = ReturnType<typeof createFocoClient>;
