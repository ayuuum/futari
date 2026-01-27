import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    profile: {
        id: string;
        display_name: string | null;
        couple_id: string | null;
        avatar_url: string | null;
        status_message: string | null;
    } | null;
    partner: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    setSession: (session: Session | null) => void;
    setProfile: (profile: AuthState['profile']) => void;
    setPartner: (partner: AuthState['partner']) => void;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    partner: null,
    isLoading: true,
    isAuthenticated: false,

    setSession: (session) => {
        set({
            session,
            user: session?.user ?? null,
            isAuthenticated: !!session,
            isLoading: false,
        });
    },

    setProfile: (profile) => {
        set({ profile });
    },

    setPartner: (partner) => {
        set({ partner });
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({
            session: null,
            user: null,
            profile: null,
            partner: null,
            isAuthenticated: false,
        });
    },

    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        const { data: profileRow } = await supabase
            .from('users')
            .select('id, display_name, couple_id, avatar_url, status_message')
            .eq('id', user.id)
            .single();

        if (profileRow) {
            set({
                profile: {
                    id: profileRow.id,
                    display_name: profileRow.display_name,
                    couple_id: profileRow.couple_id,
                    avatar_url: profileRow.avatar_url,
                    status_message: profileRow.status_message ?? null,
                },
            });

            if (profileRow.couple_id) {
                const { data: partnerRow } = await supabase
                    .from('users')
                    .select('id, display_name, avatar_url')
                    .eq('couple_id', profileRow.couple_id)
                    .neq('id', user.id)
                    .single();

                if (partnerRow) {
                    set({
                        partner: {
                            id: partnerRow.id,
                            display_name: partnerRow.display_name,
                            avatar_url: partnerRow.avatar_url,
                        },
                    });
                } else {
                    set({ partner: null });
                }
            } else {
                set({ partner: null });
            }
        }
    },
}));
