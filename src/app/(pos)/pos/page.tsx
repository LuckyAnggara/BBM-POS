
'use client'; // Add 'use client'
import { useState } from 'react'; // Import useState
import { ProductSelection } from "@/components/pos/product-selection";
import { CartDisplay } from "@/components/pos/cart-display";
import { PosSessionManager } from "@/components/pos/pos-session-manager";
import { SalesHistoryModal } from '@/components/pos/sales-history-modal'; // Import modal
import { Button } from '@/components/ui/button'; // Import Button
import { History } from 'lucide-react'; // Import History icon

export default function POSPage() {
  const [isSalesHistoryModalOpen, setIsSalesHistoryModalOpen] = useState(false);

  const toggleSalesHistoryModal = () => setIsSalesHistoryModalOpen(!isSalesHistoryModalOpen);

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-4 md:gap-6"> 
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <PosSessionManager />
        <Button variant="outline" onClick={toggleSalesHistoryModal} className="w-full sm:w-auto">
          <History className="mr-2 h-4 w-4" /> Recent Sales
        </Button>
      </div>
      <div className="grid md:grid-cols-[2fr_1fr] gap-4 md:gap-6 flex-1 overflow-hidden">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full flex flex-col">
          <ProductSelection />
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full flex flex-col">
          <CartDisplay />
        </div>
      </div>
      <SalesHistoryModal isOpen={isSalesHistoryModalOpen} onClose={toggleSalesHistoryModal} />
    </div>
  );
}

    