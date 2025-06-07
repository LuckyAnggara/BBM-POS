
import { create } from 'zustand';
import type { PosSession } from '@/lib/types';
import { toast } from 'sonner';
import { getActivePosSession, startPosSession as startPosSessionAction, endPosSession as endPosSessionAction } from '@/app/(pos)/actions';

interface PosSessionState {
  activeSession: PosSession | null;
  isLoading: boolean;
  error: string | null;
  fetchActiveSession: () => Promise<void>;
  startSession: (startingCash: number) => Promise<PosSession | null>;
  endSession: (countedCash: number) => Promise<void>; // Added
  clearSession: () => void; 
  setSession: (session: PosSession | null) => void; 
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
  
  endSession: async (countedCash: number) => {
    const currentSession = get().activeSession;
    if (!currentSession) {
      toast.error("No active session to end.");
      set({ isLoading: false }); // Ensure loading is reset
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await endPosSessionAction(currentSession.id, countedCash);
      set({ activeSession: null, isLoading: false });
      toast.success("POS session ended successfully.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to end POS session.";
      console.error(errorMessage, err);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  setSession: (session: PosSession | null) => {
    set({ activeSession: session, isLoading: false, error: null });
  },

  clearSession: () => {
    set({ activeSession: null, isLoading: false, error: null });
  },
}));
