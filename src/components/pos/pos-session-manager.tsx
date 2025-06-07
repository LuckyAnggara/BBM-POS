
'use client';

import { useEffect, useState } from 'react';
import { usePosSessionStore } from '@/store/pos-session-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, PlayCircle, PowerOff, DollarSign, UserCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';

export function PosSessionManager() {
  const { activeSession, isLoading, error, fetchActiveSession, startSession } = usePosSessionStore();
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false);
  const [startingCash, setStartingCash] = useState('');
  const [isSubmittingStart, setIsSubmittingStart] = useState(false);

  const [isEndShiftDialogOpen, setIsEndShiftDialogOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState('');
  const [isEndingSession, setIsEndingSession] = useState(false);


  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  const handleStartSession = async () => {
    const cashAmount = parseFloat(startingCash);
    if (isNaN(cashAmount) || cashAmount < 0) {
      toast.error("Please enter a valid non-negative amount for starting cash.");
      return;
    }
    setIsSubmittingStart(true);
    const newSession = await startSession(cashAmount);
    if (newSession) {
      setIsStartShiftDialogOpen(false);
      setStartingCash('');
    }
    setIsSubmittingStart(false);
  };
  
  const handleEndShiftConfirm = async () => {
    const cash = parseFloat(countedCashInput);
    if (isNaN(cash) || cash < 0) {
      toast.error("Please enter a valid counted cash amount.");
      return;
    }
    setIsEndingSession(true);
    await usePosSessionStore.getState().endSession(cash);
    setIsEndingSession(false);
    setIsEndShiftDialogOpen(false); 
    setCountedCashInput(''); 
  };


  if (isLoading && !activeSession) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading POS session...</p>
        </CardContent>
      </Card>
    );
  }

  if (!activeSession) {
    return (
      <>
        <Card className="mb-4 bg-amber-50 border-amber-200">
          <CardHeader className="p-3">
            <CardTitle className="text-base text-amber-700">No Active POS Session</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xs text-amber-600 mb-2">
              You need to start a new shift to begin making sales.
            </p>
            <Button onClick={() => setIsStartShiftDialogOpen(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              <PlayCircle className="mr-2 h-4 w-4" /> Start Shift
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isStartShiftDialogOpen} onOpenChange={setIsStartShiftDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Start New POS Shift</DialogTitle>
              <DialogDescription>
                Enter the amount of cash you are starting with in the drawer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startingCash" className="text-right">
                  Starting Cash
                </Label>
                <div className="col-span-3 relative">
                   <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startingCash"
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                    disabled={isSubmittingStart}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmittingStart}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleStartSession} disabled={isSubmittingStart || !startingCash.trim()}>
                {isSubmittingStart && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Active session display
  return (
    <>
    <Card className="mb-4 shadow-md">
        <CardHeader className="p-3 flex flex-row items-center justify-between bg-primary/5 rounded-t-lg">
            <div>
                <CardTitle className="text-base font-headline text-primary">POS Session Active</CardTitle>
                <p className="text-xs text-muted-foreground">
                    Shift started at: {format(new Date(activeSession.startTime), 'MMM dd, yyyy HH:mm')}
                </p>
            </div>
            <Button onClick={() => setIsEndShiftDialogOpen(true)} size="sm" variant="outline" className="text-xs border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                <PowerOff className="mr-2 h-3.5 w-3.5" /> End Shift
            </Button>
        </CardHeader>
      <CardContent className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <UserCircle className="h-5 w-5 text-primary"/>
            <div>
                <p className="text-muted-foreground">Cashier</p>
                <p className="font-semibold truncate">{activeSession.user?.name || 'N/A'}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <DollarSign className="h-5 w-5 text-green-500"/>
            <div>
                <p className="text-muted-foreground">Starting Cash</p>
                <p className="font-semibold">${activeSession.startingCash.toFixed(2)}</p>
            </div>
        </div>
         <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <DollarSign className="h-5 w-5 text-blue-500"/>
            <div>
                <p className="text-muted-foreground">Cash Sales</p>
                <p className="font-semibold">${activeSession.totalSalesAmount.toFixed(2)}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <DollarSign className="h-5 w-5 text-orange-500"/>
            <div>
                <p className="text-muted-foreground">Expected in Drawer</p>
                <p className="font-semibold">${activeSession.expectedCashInDrawer.toFixed(2)}</p>
            </div>
        </div>
      </CardContent>
    </Card>

    {/* End Shift Dialog */}
    <Dialog open={isEndShiftDialogOpen} onOpenChange={setIsEndShiftDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Current Shift</DialogTitle>
          <DialogDescription>
            Count the cash in your drawer and enter the total amount.
            Expected cash in drawer is currently: <strong>${activeSession.expectedCashInDrawer.toFixed(2)}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="countedCashInput">Counted Cash Total</Label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="countedCashInput"
                type="number"
                value={countedCashInput}
                onChange={(e) => setCountedCashInput(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                disabled={isEndingSession}
              />
            </div>
          </div>
          {countedCashInput && !isNaN(parseFloat(countedCashInput)) && activeSession.expectedCashInDrawer !== null && (
            <div className="text-sm mt-2 p-3 bg-muted/50 rounded-md">
              <p>Expected: ${activeSession.expectedCashInDrawer.toFixed(2)}</p>
              <p>Counted: ${parseFloat(countedCashInput).toFixed(2)}</p>
              <p className={`font-semibold ${parseFloat(countedCashInput) - activeSession.expectedCashInDrawer === 0 ? 'text-gray-600' : (parseFloat(countedCashInput) - activeSession.expectedCashInDrawer > 0 ? 'text-green-600' : 'text-red-600')}`}>
                Difference: ${(parseFloat(countedCashInput) - activeSession.expectedCashInDrawer).toFixed(2)}
                {parseFloat(countedCashInput) - activeSession.expectedCashInDrawer > 0 ? ' (Over)' : parseFloat(countedCashInput) - activeSession.expectedCashInDrawer < 0 ? ' (Short)' : ' (Balanced)'}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isEndingSession}>Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleEndShiftConfirm}
            disabled={isEndingSession || !countedCashInput.trim()}
          >
            {isEndingSession && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & End Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
