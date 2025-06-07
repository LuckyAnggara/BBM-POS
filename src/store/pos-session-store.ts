
import { create } from 'zustand';
import type { PosSession } from '@/lib/types';
import { toast } from 'sonner';
import { getActivePosSession, startPosSession as startPosSessionAction } from '@/app/(pos)/actions';

interface PosSessionState {
  activeSession: PosSession | null;
  isLoading: boolean;
  error: string | null;
  fetchActiveSession: () => Promise<void>;
  startSession: (startingCash: number) => Promise<PosSession | null>;
  clearSession: () => void; // For logout or manual reset
  setSession: (session: PosSession | null) => void; // Direct setter
}

export const usePosSessionStore = create<PosSessionState>((set, get) => ({
  activeSession: null,
  isLoading: false,
  error: null,

  fetchActiveSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessionData = await getActivePosSession();
      set({ activeSession: sessionData, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch active POS session.";
      console.error(errorMessage, err);
      set({ error: errorMessage, isLoading: false, activeSession: null });
      // Do not toast here as this might be called on every POS page load.
      // Let components decide if they want to show an error.
    }
  },

  startSession: async (startingCash: number) => {
    set({ isLoading: true, error: null });
    try {
      const newSession = await startPosSessionAction(startingCash);
      set({ activeSession: newSession, isLoading: false });
      toast.success(`POS session started with $${startingCash.toFixed(2)} initial cash.`);
      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start POS session.";
      console.error(errorMessage, err);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return null;
    }
  },
  
  setSession: (session: PosSession | null) => {
    set({ activeSession: session, isLoading: false, error: null });
  },

  clearSession: () => {
    set({ activeSession: null, isLoading: false, error: null });
    // Optionally: toast.info("POS session cleared.");
  },
}));

