/**
 * Smart Growth API Client
 * Connects Frontend React to the Laravel Backend API (http://127.0.0.1:8000/api)
 * Gracefully falls back to local data if the backend server is offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("smart_growth_token") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new Error(errBody?.message || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`[SmartGrowth API] Fetch to ${endpoint} failed or offline:`, err);
    return null;
  }
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | {
      ok: false;
      /** 0 = server tidak dapat dihubungi (offline). */
      status: number;
      message: string;
      /** Error per field dari validasi Laravel (HTTP 422). */
      errors: Record<string, string>;
      body: any;
    };

/**
 * Seperti apiFetch, tetapi tidak membuang pesan error server, sehingga
 * error validasi backend (422) bisa ditampilkan di field form yang sesuai.
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("smart_growth_token") : null;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      },
    });
    const body = await response.json().catch(() => null);
    if (response.ok) return { ok: true, status: response.status, data: body as T };

    const errors: Record<string, string> = {};
    for (const [field, messages] of Object.entries(body?.errors ?? {})) {
      errors[field] = Array.isArray(messages) ? String(messages[0]) : String(messages);
    }
    return {
      ok: false,
      status: response.status,
      message: body?.message || `Terjadi kesalahan (HTTP ${response.status}).`,
      errors,
      body,
    };
  } catch {
    return { ok: false, status: 0, message: "Server tidak dapat dihubungi.", errors: {}, body: null };
  }
}

export const SmartGrowthAPI = {
  // Auth & Roles
  login: async (username: string, password: string) => {
    return await apiFetch<{
      success: boolean;
      message?: string;
      data: {
        token: string;
        user: {
          id: string;
          username: string;
          name: string;
          role: string;
          avatarInitials: string;
          defaultPage: string;
        };
        sidebarMenus: Array<{
          to: string;
          label: string;
          icon: string;
          roles: string[];
          description?: string;
        }>;
      };
    }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Aktivasi akun via OTP email
  activateAccount: (email: string, otp: string) =>
    apiRequest<{ success: boolean; message: string }>("/activate", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  resendActivationOtp: (email: string) =>
    apiRequest<{ success: boolean; message: string }>("/activate/resend", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  logout: async () => {
    return await apiFetch("/logout", { method: "POST" });
  },

  getSidebarMenus: async (role: string) => {
    return await apiFetch<{
      success: boolean;
      data: Array<{
        to: string;
        label: string;
        icon: string;
        roles: string[];
      }>;
    }>(`/sidebar?role=${encodeURIComponent(role)}`);
  },

  // Users (Kelola Pengguna - Super Admin)
  getUsers: async () => {
    return await apiFetch<{ success: boolean; data: any[] }>("/users");
  },

  addUser: (data: any) =>
    apiRequest<{ success: boolean; message?: string; requiresActivation?: boolean; data: any }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: any) =>
    apiRequest<{ success: boolean; message?: string; data: any }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteUser: async (id: string) => {
    return await apiFetch<{ success: boolean; message?: string }>(`/users/${id}`, {
      method: "DELETE",
    });
  },

  // Children Data (Data Anak - Tata Usaha)
  getKids: async () => {
    return await apiFetch<{ success: boolean; data: any[] }>("/anak");
  },

  addKid: (data: any) =>
    apiRequest<{ success: boolean; message?: string; data: any }>("/anak", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateKid: (id: string, data: any) =>
    apiRequest<{ success: boolean; message?: string; data: any }>(`/anak/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteKid: async (id: string) => {
    return await apiFetch<{ success: boolean; message?: string }>(`/anak/${id}`, {
      method: "DELETE",
    });
  },

  // Standar Gizi (Ahli Gizi)
  getStandardGizi: async () => {
    return await apiFetch<{
      success: boolean;
      formula: string;
      tableWHO: any[];
      categories?: any[];
    }>("/standard-gizi");
  },

  // Status Gizi (Ahli Gizi & Admin Dapur)
  getStatusGizi: async () => {
    return await apiFetch<{
      success: boolean;
      distribution: Array<{ status: string; count: number; percent: number }>;
    }>("/status-gizi");
  },

  // Foods & Menus (Rekomendasi Menu - Ahli Gizi)
  getFoods: async () => {
    return await apiFetch<{ success: boolean; data: any[] }>("/foods");
  },

  /** Tambah bahan makanan baru (divalidasi juga di server). */
  addFood: (data: { name: string; calories: number; protein: number; carbs: number; fat: number }) =>
    apiRequest<{ success: boolean; message?: string; data: any }>("/foods", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMenus: async () => {
    return await apiFetch<{ success: boolean; data: any[] }>("/rekomendasi-menu");
  },

  generateMenu: async () => {
    return await apiFetch<{ success: boolean; data: any }>("/rekomendasi-menu/generate", {
      method: "POST",
    });
  },

  saveDraftMenu: async (data: any) => {
    return await apiFetch<{ success: boolean; data: any }>("/rekomendasi-menu/draft", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Langkah 1 approve: kirim OTP ke email penyetuju. */
  requestApproveMenuOtp: (menuId: string) =>
    apiRequest<{ success: boolean; message: string; email: string; expiresIn: number; maxAttempts: number }>(
      `/rekomendasi-menu/${encodeURIComponent(menuId)}/approve/request-otp`,
      { method: "POST" },
    ),

  /** Langkah 2 approve: setujui menu dengan kode OTP. */
  approveMenu: (menuId: string, otp: string) =>
    apiRequest<{ success: boolean; message: string; data: any }>(
      `/rekomendasi-menu/${encodeURIComponent(menuId)}/approve`,
      { method: "POST", body: JSON.stringify({ otp }) },
    ),

  deleteMenu: async (menuId: string) => {
    return await apiFetch<{ success: boolean; message?: string }>(`/rekomendasi-menu/${menuId}`, {
      method: "DELETE",
    });
  },

  // Laporan Menu (Admin Dapur MBG)
  getLaporanMenu: async () => {
    return await apiFetch<{ success: boolean; reports: any[]; jadwalMasak?: any[] }>("/laporan-menu");
  },
};
