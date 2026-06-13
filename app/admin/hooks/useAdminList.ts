"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminApiError, adminApi } from "../lib/adminApi";
import type { PaginatedResponse, Pagination } from "../types/admin";

type Filters = Record<string, string | number | undefined>;

export function useAdminList<T>(endpoint: string, initialFilters: Filters = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, page: pagination.page, limit: pagination.limit }).forEach(
      ([key, value]) => {
        if (value !== undefined && String(value) !== "") params.set(key, String(value));
      }
    );
    return params.toString();
  }, [filters, pagination.limit, pagination.page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.get<PaginatedResponse<T>>(`${endpoint}?${query}`);
      setItems(response.data);
      setPagination((current) => ({ ...response.pagination, limit: current.limit }));
    } catch (requestError) {
      setError(requestError instanceof AdminApiError ? requestError.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateFilters = (next: Filters) => {
    setFilters((current) => ({ ...current, ...next }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  return {
    items,
    setItems,
    pagination,
    filters,
    loading,
    error,
    refresh: load,
    updateFilters,
    setPage: (page: number) => setPagination((current) => ({ ...current, page })),
    setLimit: (limit: number) => setPagination((current) => ({ ...current, page: 1, limit })),
  };
}
