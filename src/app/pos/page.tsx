
import { ProductSelection } from "@/components/pos/product-selection";
import { CartDisplay } from "@/components/pos/cart-display";

export default function POSPage() {
  return (
    // Menggunakan h-full karena layout induk (src/app/pos/layout.tsx) sudah h-screen
    <div className="flex flex-col h-full p-4 md:p-6 gap-4 md:gap-6"> 
      {/* Judul POS bisa tetap atau dihilangkan jika tombol keluar sudah jelas */}
      {/* <div className="flex flex-col">
        <h1 className="text-xl font-headline font-semibold">Point of Sale</h1>
      </div> */}
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
