import { apiRequest, SmartGrowthAPI } from "@/lib/api-client";
import { useAppStore, type UserSession } from "@/lib/nutrition-store";
import { findUserByUsername } from "@/lib/users";

export const AUTH_FAILED_MESSAGE = "Username atau password tidak valid. Silakan coba lagi.";

const TOKEN_KEY = "smart_growth_token";

export type LoginResult =
  | { status: "success"; user: UserSession }
  | { status: "needs-activation"; email: string }
  | { status: "failed"; message: string; fieldErrors: { username?: string; password?: string } };

export const AuthController = {
  async login(username: string, password: string): Promise<LoginResult> {
    const res = await apiRequest<any>("/login", {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password }),
    });

    if (res.ok && res.data?.data) {
      const { token, user } = res.data.data;
      const session: UserSession = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatarInitials: user.avatarInitials,
        defaultPage: user.defaultPage,
      };
      AuthController.initSession(session, token);
      return { status: "success", user: session };
    }

    if (!res.ok && res.status !== 0) {
      if (res.body?.code === "ACCOUNT_NOT_ACTIVATED") {
        return { status: "needs-activation", email: res.body.email || "" };
      }
      if (res.errors.username || res.errors.password) {
        return { status: "failed", message: "", fieldErrors: res.errors };
      }
      return { status: "failed", message: res.message, fieldErrors: {} };
    }

    const localUser = findUserByUsername(username);
    if (!localUser || !AuthController.validatePassword(localUser.password, password)) {
      return AuthController.authFailed();
    }
    const session: UserSession = {
      id: localUser.id,
      username: localUser.username,
      name: localUser.name,
      role: localUser.role,
      avatarInitials: localUser.avatarInitials,
      defaultPage: localUser.defaultPage,
    };
    AuthController.initSession(session);
    return { status: "success", user: session };
  },

  validatePassword(expectedPassword: string, inputPassword: string): boolean {
    return expectedPassword === inputPassword;
  },

  initSession(user: UserSession, token?: string): void {
    if (token && typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
    useAppStore.getState().login(user);
  },

  authFailed(): LoginResult {
    return { status: "failed", message: AUTH_FAILED_MESSAGE, fieldErrors: {} };
  },

  redirectDashboard(user: Pick<UserSession, "defaultPage">): string {
    return user.defaultPage || "/kelola-pengguna";
  },

  async invalidateSession(): Promise<void> {
    try {
      await SmartGrowthAPI.logout();
    } catch {
    }
    useAppStore.getState().logout();
  },

  async logout(): Promise<string> {
    await AuthController.invalidateSession();
    return AuthController.redirectToLogin();
  },

  redirectToLogin(): string {
    return "/masuk";
  },
};
