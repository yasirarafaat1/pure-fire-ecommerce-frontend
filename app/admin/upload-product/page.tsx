import { redirect } from "next/navigation";

export default function LegacyUploadProductPage() {
  redirect("/admin/products/new");
}
