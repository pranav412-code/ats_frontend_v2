import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
// Lazy require to avoid circular import at module load — useResumeStore
// imports from ../lib/api which may transitively reach auth state. We call
// .getState() inside handlers, after module graph settles.
import { useResumeStore } from './useResumeStore';

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  recoveryMode: boolean;
  clearRecoveryMode: () => void;
  initialize: () => void;
  signOut: () => Promise<void>;
}

let authUnsubscribe: (() => void) | null = null;
let initializing = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  recoveryMode: false,
  clearRecoveryMode: () => set({ recoveryMode: false }),
  initialize: () => {
    if (authUnsubscribe || initializing) return;
    initializing = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user || null, initialized: true });
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        set({ session, user: session?.user || null, recoveryMode: true });
        return;
      }
      // Detect user-id change (different user logged in on same browser
      // without explicit signOut). Previously, prev user's credits /
      // subscription / resumes lingered in zustand memory and flashed on
      // dashboard before refetch completed.
      const prevUserId = useAuthStore.getState().user?.id ?? null;
      const nextUserId = session?.user?.id ?? null;
      if (prevUserId && nextUserId && prevUserId !== nextUserId) {
        useResumeStore.getState().reset();
      }
      if (event === 'SIGNED_OUT') {
        useResumeStore.getState().reset();
      }
      set({ session, user: session?.user || null });
    });
    authUnsubscribe = () => data.subscription.unsubscribe();
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
    // Wipe persisted + in-memory resume-store state so a different user
    // logging in on the same browser can't see the previous user's
    // credits, subscription, resume list, or routing state. Pairs with
    // backend Cache-Control: no-store on /api/v1/* responses.
    useResumeStore.getState().reset();
    set({ session: null, user: null });
  },
}));
