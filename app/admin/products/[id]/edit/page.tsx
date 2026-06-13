"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminPageHeader from "../../../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../../../components/AdminStates";
import { AdminApiError, adminApi } from "../../../lib/adminApi";
import ProductWizard from "../../../upload-product/components/ProductWizard";

type Product = Record<string, unknown> & { name?: string };

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    adminApi
      .get<{ data: Product }>(`/products/${params.id}`)
      .then((response) => setProduct(response.data))
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Product failed")
      );
  };
  useEffect(() => {
    adminApi
      .get<{ data: Product }>(`/products/${params.id}`)
      .then((response) => setProduct(response.data))
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Product failed")
      );
  }, [params.id]);

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (!product) return <AdminLoadingState label="Loading product editor..." />;
  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title={`Edit ${product.name || "product"}`}
        description="Changes are saved through the protected product management API."
      />
      <ProductWizard
        product={product}
        onSaved={() => router.push("/admin/products")}
        onClose={() => router.push("/admin/products")}
      />
    </div>
  );
}
