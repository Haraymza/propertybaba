import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const flushPendingRequests = (token: string | null) => {
  pendingRequests.forEach((resolve) => resolve(token));
  pendingRequests = [];
};

const clearSessionAndRedirectToLogin = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("property-baba-auth");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as { _retry?: boolean; headers?: Record<string, string>; url?: string };
    const requestUrl = String(originalRequest?.url || "");
    const isAuthRoute =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/refresh") ||
      requestUrl.includes("/api/auth/register");

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refreshToken) {
      clearSessionAndRedirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshResponse = await axios.post<AuthTokens>(`${API_BASE_URL}/api/auth/refresh`, { refresh_token: refreshToken });
      const newAccessToken = refreshResponse.data.access_token;
      const newRefreshToken = refreshResponse.data.refresh_token;
      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken);
      flushPendingRequests(newAccessToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushPendingRequests(null);
      clearSessionAndRedirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type User = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  admin_flag: boolean;
  is_approved: boolean;
  organization_id?: string | null;
  created_at: string;
};

export type Customer = {
  _id: string;
  name: string;
  phone_number: string[];
  preference: "buy" | "rent";
  size: string;
  priority: "Low" | "Medium" | "High";
  status: "in_process" | "closed";
  properties_assigned: number;
  created_by?: string | null;
  created_by_name?: string | null;
  is_deleted?: boolean;
  created_at: string;
};

export type Property = {
  _id: string;
  title: string;
  address: string;
  price: number;
  type: "sell" | "rent";
  type_of_property: string;
  size: string;
  seller_name: string;
  seller_phone: string[];
  status: "available" | "assigned" | "sold";
  created_by?: string | null;
  created_by_name?: string | null;
  is_deleted?: boolean;
  created_at: string;
};

export type Deal = {
  _id: string;
  customer_id: string;
  property_id: string;
  deal_type: "buy" | "rent";
  status: "in_process" | "completed" | "cancelled";
  financials: Array<{ deal_price: number; org_revenue_cut: number; user_revenue_cut: number }>;
  override_commission?: boolean;
  created_by?: string;
  closed_by?: string | null;
  is_deleted?: boolean;
  date_assigned: string;
  date_completed?: string | null;
  customer?: { name?: string };
  property?: { title?: string; price?: number };
  created_by_user?: { name?: string; phone?: string };
  customer_creator?: { name?: string; phone?: string };
  property_creator?: { name?: string; phone?: string };
};

export type CommissionDefaults = { org_percent: number; agent_percent: number };

export type AgentRevenueRow = {
  user_id?: string | null;
  agent_name: string;
  agent_phone?: string | null;
  completed_deals: number;
  gross_deal_value: number;
  org_commission_total: number;
  agent_commission_total: number;
};

export type DashboardStats = {
  total_customers: number;
  total_properties: number;
  total_deals: number;
  active_deals: number;
  completed_deals: number;
  total_revenue: number;
};

export type DashboardContext = {
  organization_name?: string | null;
};

export const authApi = {
  register: (payload: { name: string; phone: string; email?: string; password: string }) =>
    api.post<User>("/api/auth/register", payload),
  login: (payload: { phone: string; password: string }) => api.post<AuthTokens>("/api/auth/login", payload),
  refresh: (refresh_token: string) => api.post<AuthTokens>("/api/auth/refresh", { refresh_token }),
  logout: (refresh_token: string) => api.post<{ message: string }>("/api/auth/logout", { refresh_token }),
  me: () => api.get<User>("/api/auth/me"),
};

export const superAdminApi = {
  createOrganization: (payload: { name: string; description?: string; owner_user_id?: string }) =>
    api.post("/api/super-admin/organizations", payload),
  listOrganizations: () => api.get("/api/super-admin/organizations"),
  listPendingUsers: () => api.get<{ users: User[] }>("/api/super-admin/users/pending"),
  assignOrganization: (userId: string, organizationId: string) =>
    api.post(`/api/super-admin/users/${userId}/assign-organization`, null, {
      params: { organization_id: organizationId },
    }),
  approveUser: (userId: string) => api.post(`/api/super-admin/users/${userId}/approve`),
  usersByOrganization: (orgId: string) => api.get<User[]>(`/api/super-admin/organizations/${orgId}/users`),
  updateUserRole: (userId: string, payload: { role: string; admin_flag: boolean; is_approved: boolean; organization_id?: string }) =>
    api.put(`/api/super-admin/users/${userId}/role`, null, { params: payload }),
  updateUserDetails: (
    userId: string,
    payload: { name?: string; phone?: string; email?: string; password?: string; role?: string; admin_flag?: boolean; is_approved?: boolean; organization_id?: string },
  ) => api.put<User>(`/api/super-admin/users/${userId}`, payload),
};

export const customersApi = {
  list: (params?: { include_archived?: boolean; q?: string }) => api.get<Customer[]>("/api/customers", { params }),
  create: (payload: Omit<Customer, "_id" | "status" | "properties_assigned" | "created_at">) => api.post<Customer>("/api/customers", payload),
  update: (id: string, payload: Partial<Customer>) => api.put<Customer>(`/api/customers/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/api/customers/${id}`),
  restore: (id: string) => api.put<Customer>(`/api/customers/${id}/restore`),
};

export const propertiesApi = {
  list: (params?: { include_archived?: boolean; q?: string; status_filter?: string }) => api.get<Property[]>("/api/properties", { params }),
  create: (payload: Omit<Property, "_id" | "status" | "created_at">) => api.post<Property>("/api/properties", payload),
  update: (id: string, payload: Partial<Property>) => api.put<Property>(`/api/properties/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/api/properties/${id}`),
  restore: (id: string) => api.put<Property>(`/api/properties/${id}/restore`),
};

export const dealsApi = {
  list: (params?: { include_archived?: boolean; q?: string }) => api.get<Deal[]>("/api/deals", { params }),
  create: (payload: { customer_id: string; property_id: string; deal_type: "buy" | "rent"; financials?: Deal["financials"]; override_commission?: boolean }) =>
    api.post<Deal>("/api/deals", payload),
  update: (id: string, payload: Partial<Deal>) => api.put<Deal>(`/api/deals/${id}`, payload),
  remove: (id: string) => api.delete<{ message: string }>(`/api/deals/${id}`),
  restore: (id: string) => api.put<Deal>(`/api/deals/${id}/restore`),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/api/dashboard/stats"),
  context: () => api.get<DashboardContext>("/api/dashboard/context"),
};

export const adminApi = {
  users: () => api.get<User[]>("/api/admin/users"),
  createUser: (payload: { name: string; phone: string; email?: string; password: string; role: string }) =>
    api.post<User>("/api/admin/users", payload),
  updateUser: (userId: string, payload: { name?: string; phone?: string; email?: string; password?: string; role?: string; is_approved?: boolean }) =>
    api.put<User>(`/api/admin/users/${userId}`, payload),
  activate: (userId: string) => api.put(`/api/admin/users/${userId}/activate`),
  deactivate: (userId: string) => api.put(`/api/admin/users/${userId}/deactivate`),
  getCommissionDefaults: () => api.get<CommissionDefaults>("/api/admin/organization/commission-defaults"),
  updateCommissionDefaults: (payload: CommissionDefaults) =>
    api.put("/api/admin/organization/commission-defaults", null, { params: payload }),
  agentRevenue: (params?: { window?: "all" | "month" }) => api.get<AgentRevenueRow[]>("/api/admin/revenue/agents", { params }),
};
