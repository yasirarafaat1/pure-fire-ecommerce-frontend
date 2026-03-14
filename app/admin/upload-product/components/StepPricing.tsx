"use client";

import { FieldRenderer } from "./types";

export default function StepPricing({ renderInput }: { renderInput: FieldRenderer }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-3">
        {renderInput("sku", "SKU", "SKU-001")}
        {renderInput("price", "Price", "1999")}
        {renderInput("selling_price", "Discounted price", "1499")}
      </div>
      <div className="grid gap-3">
        {renderInput("quantity", "Stock", "50")}
        {renderInput("colors", "Colors (comma separated)", "Black, Stone, Navy")}
        {renderInput("sizes", "Sizes (comma separated)", "30,32,34")}
      </div>
    </section>
  );
}
