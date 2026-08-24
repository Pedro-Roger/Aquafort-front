import axios from 'axios';

const TOKEN_KEY = 'aquafort_token';
const REFRESH_KEY = 'aquafort_refresh';
/**
 * Multi-fazenda (Entrega 4): fazenda ativa persistida aqui, no mesmo padrão do
 * token. Todo endpoint de domínio agora exige o header `X-Farm-Id`
 * (FarmScopeGuard no backend) — sem ele, tudo responde 403. Ver src/store/farm.tsx
 * para quem escreve essa chave (login inicial ainda não tem fazenda ativa até
 * `/me/farms` resolver, por isso o header só é enviado quando o valor existe).
 */
export const ACTIVE_FARM_KEY = 'aquafort_active_farm_id';

function isNumericString(value: string): boolean {
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.trim());
}

/**
 * Domain identifiers, never Decimal-as-string values — must never be
 * silently turned into a number just because they happen to look numeric
 * (a pond coded "101" with no letter prefix, unlike "VB101", is a real,
 * valid code — crashed every `.localeCompare()`/`.split()` on `pond.code`
 * across the app, e.g. TransferenciaPage's priority sort, until this
 * exclusion existed).
 */
const NEVER_REVIVE_KEYS = /code$/i;

function reviveNumericStrings<T>(value: T, key?: string): T {
  if (Array.isArray(value)) {
    return value.map((item) => reviveNumericStrings(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([entryKey, entry]) => [
      entryKey,
      reviveNumericStrings(entry, entryKey),
    ]);

    return Object.fromEntries(entries) as T;
  }

  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    isNumericString(value) &&
    !(key && NEVER_REVIVE_KEYS.test(key))
  ) {
    return Number(value) as T;
  }

  return value;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const farmId = localStorage.getItem(ACTIVE_FARM_KEY);
  if (farmId) {
    config.headers['X-Farm-Id'] = farmId;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    response.data = reviveNumericStrings(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const sentToken = String(originalRequest.headers?.Authorization ?? '').replace('Bearer ', '');

      // A request that left before a refresh comes back 401 carrying the old
      // token. The session was already renewed by whoever refreshed, so this
      // one just needs sending again — trying to refresh with the rotated
      // token would fail and end the session, which is what was logging
      // people out mid-use.
      if (storedToken && sentToken && sentToken !== storedToken) {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${storedToken}`;
        return api(originalRequest);
      }

      const refreshToken = localStorage.getItem(REFRESH_KEY);

      if (!refreshToken) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/v1/auth/refresh`,
          { refreshToken }
        );
        const newToken = data.accessToken;
        const newRefreshToken = data.refreshToken;
        localStorage.setItem(TOKEN_KEY, newToken);
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_KEY, newRefreshToken);
        }
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
