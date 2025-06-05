import { ProductSelection } from "@/components/pos/product-selection";
import { CartDisplay } from "@/components/pos/cart-display";

export default function POSPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,56px)-2*theme(spacing.6))]"> {/* Adjust height based on your header/paddings */}
       <h1 className="text-3xl font-headline font-semibold mb-6">Point of Sale</h1>
      <div className="grid md:grid-cols-[3fr_2fr] gap-6 flex-1 overflow-hidden">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full">
          <ProductSelection />
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full">
          <CartDisplay />
        </div>
      </div>
    </div>
  );
}
