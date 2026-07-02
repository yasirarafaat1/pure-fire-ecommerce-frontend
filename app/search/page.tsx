"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchModal from "./components/SearchModal";

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <SearchModal
      open
      initialQuery={searchParams.get("q") || ""}
      onClose={() => router.back()}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
