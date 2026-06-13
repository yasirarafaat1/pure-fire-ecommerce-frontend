"use client";

import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import ProductWizard from "../../upload-product/components/ProductWizard";

export default function NewProductPage() {
  const router = useRouter();
  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Add product"
        description="Create a catalog product through the existing validated step-wise workflow."
      />
      <ProductWizard
        onSaved={() => router.push("/admin/products")}
        onClose={() => router.push("/admin/products")}
      />
    </div>
  );
}
