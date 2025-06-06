
import { ProductSelection } from "@/components/pos/product-selection";
import { CartDisplay } from "@/components/pos/cart-display";
import { PosSessionManager } from "@/components/pos/pos-session-manager"; // Import the new component

export default function POSPage() {
  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-4 md:gap-6"> 
      <PosSessionManager /> {/* Add the session manager here */}
      <div className="grid md:grid-cols-[2fr_1fr] gap-4 md:gap-6 flex-1 overflow-hidden">
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
