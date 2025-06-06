
import { ProductSelection } from "@/components/pos/product-selection";
import { CartDisplay } from "@/components/pos/cart-display";

export default function POSPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,56px)-theme(spacing.6))] gap-6"> {/* Use gap-6 for spacing between title and grid */}
      <div className="flex flex-col">
        {/* Replicating the "MENU > ORDERS" breadcrumb is out of scope for now, focus on main title */}
        <h1 className="text-2xl font-headline font-semibold">Point of Sale</h1> {/* Adjusted title size */}
      </div>
      <div className="grid md:grid-cols-[2fr_1fr] gap-6 flex-1 overflow-hidden"> {/* Adjusted grid ratio to give more space to products */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full flex flex-col">
          <ProductSelection />
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full flex flex-col">
          <CartDisplay />
        </div>
      </div>
    </div>
  );
}
