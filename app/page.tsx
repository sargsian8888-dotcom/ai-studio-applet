'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import AuthForm from '@/components/AuthForm';
import CandidatePortal from '@/components/CandidatePortal';
import EmployerPortal from '@/components/EmployerPortal';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { user, role, setUser, setRole } = useStore();
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (userId: string, email?: string, fullName?: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User not found in users table, insert them as candidate
        const { error: insertError } = await supabase
          .from('users')
          .upsert([
            {
              id: userId,
              email: email || '',
              full_name: fullName || 'Candidate',
              role: 'candidate',
            },
          ], { onConflict: 'id' });
        
        if (!insertError) {
          setRole('candidate');
        } else {
          // Suppress the error if it's an RLS violation or empty object, 
          // as we default to candidate role anyway.
          setRole('candidate');
        }
      } else if (error) {
        console.error('Error fetching role:', error);
      } else if (data?.role) {
        setRole(data.role as 'candidate' | 'employer');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [setRole]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.id, session.user.email, session.user.user_metadata?.full_name);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.id, session.user.email, session.user.user_metadata?.full_name);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole, setRole, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center transition-colors duration-300">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white flex flex-col md:flex-row transition-colors duration-300">
      {!user ? (
        <>
          {/* Left Pane - Massive Typography */}
          <div className="flex-1 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10 relative overflow-hidden min-h-[50vh] md:min-h-screen">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,80,20,0.15),transparent_50%)]" />
            
            <div className="relative z-10">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[clamp(4rem,10vw,10rem)] leading-[0.85] tracking-tighter uppercase"
              >
                Find<br/>Your<br/>Next<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  Move.
                </span>
              </motion.h1>
            </div>

            <div className="relative z-10 mt-12 md:mt-0">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="font-mono text-xs text-gray-500 dark:text-white/50 uppercase tracking-[0.2em]"
              >
                Qayl // Next-Gen Matching
              </motion.p>
            </div>
          </div>

          {/* Right Pane - Auth */}
          <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(255,40,80,0.1),transparent_50%)]" />
            <div className="w-full max-w-md relative z-10">
              <AuthForm />
            </div>
          </div>
        </>
      ) : role === 'employer' ? (
        <div className="w-full"><EmployerPortal /></div>
      ) : (
        <div className="w-full"><CandidatePortal /></div>
      )}
    </main>
  );
}
