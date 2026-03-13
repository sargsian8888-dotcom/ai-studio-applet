import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { Language } from '@/lib/translations';

interface AppState {
  user: User | null;
  role: 'candidate' | 'employer' | null;
  language: Language;
  theme: 'dark' | 'light';
  setUser: (user: User | null) => void;
  setRole: (role: 'candidate' | 'employer' | null) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      language: 'en',
      theme: 'dark',
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      logout: () => set({ user: null, role: null }),
    }),
    {
      name: 'qayl-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        language: state.language,
        role: state.role
      }),
    }
  )
);
