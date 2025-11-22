import apiClient from "./client";
import { User } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const FRONT_URL = process.env.BASE_URL || "http://localhost:3000";

export const authApi = {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  loginWithDiscord() {
    window.location.href = `${API_URL}/oauth2/authorization/discord`;
  },

  logout() {
    localStorage.removeItem("token");
    window.location.href = `${FRONT_URL}/auth/login`;
  },

  setToken(token: string) {
    localStorage.setItem("token", token);
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },
};
