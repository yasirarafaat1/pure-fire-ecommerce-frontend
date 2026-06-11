/**
 * Admin Protected Route Wrapper
 * Ensures admin is authenticated before accessing admin pages
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "./adminAuth";

export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const router = useRouter();

    useEffect(() => {
      if (!isAdminAuthenticated()) {
        router.replace("/admin/login?redirect=" + encodeURIComponent(window.location.pathname));
      }
    }, [router]);

    if (!isAdminAuthenticated()) {
      return null;
    }

    return <Component {...props} />;
  };
}
