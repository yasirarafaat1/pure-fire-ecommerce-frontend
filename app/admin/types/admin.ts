export type AdminRole = "SUPER_ADMIN" | "MANAGER" | "SUPPORT" | "CONTENT";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: AdminRole;
  status: "ACTIVE" | "DISABLED";
  lastLoginAt?: string | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type ApiMessage = {
  status: boolean;
  message?: string;
};
