'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { motion } from 'motion/react';
import { Loader2, ArrowRight } from 'lucide-react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setRole: setStoreRole } = useStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (userError && userError.code !== 'PGRST116') {
             console.error('Error fetching user role:', userError);
          }

          setUser(data.user);
          if (userData?.role) {
            setStoreRole(userData.role as 'candidate' | 'employer');
          }
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          let companyId = null;

          if (role === 'employer') {
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .insert([{ name: fullName }])
              .select('id')
              .single();

            if (companyError) throw companyError;
            companyId = companyData.id;
          }

          const { error: userInsertError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                full_name: fullName,
                role: role,
                company_id: companyId,
              },
            ]);

          if (userInsertError) throw userInsertError;

          setUser(data.user);
          setStoreRole(role);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div className="mb-12">
        <h2 className="font-display text-4xl uppercase tracking-tighter text-white">
          {isLogin ? 'Access Portal' : 'Initialize'}
        </h2>
        <p className="font-mono text-xs text-white/40 uppercase tracking-widest mt-2">
          {isLogin ? 'Enter credentials to continue' : 'Create your secure profile'}
        </p>
      </div>
      
      {error && (
        <div className="mb-8 p-4 border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-xs uppercase tracking-wider">
          {error}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-8">
        {!isLogin && (
          <div className="relative group">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors rounded-none font-sans text-lg peer"
              placeholder="Full Name"
            />
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-orange-500 transition-all duration-300 peer-focus:w-full" />
          </div>
        )}

        <div className="relative group">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors rounded-none font-sans text-lg peer"
            placeholder="Email Address"
          />
          <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-orange-500 transition-all duration-300 peer-focus:w-full" />
        </div>

        <div className="relative group">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors rounded-none font-sans text-lg peer"
            placeholder="Password"
          />
          <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-orange-500 transition-all duration-300 peer-focus:w-full" />
        </div>

        {!isLogin && (
          <div className="pt-4">
            <label className="font-mono text-xs text-white/40 uppercase tracking-widest block mb-4">Select Designation</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`py-3 px-4 rounded-full font-mono text-xs uppercase tracking-widest transition-all border ${
                  role === 'candidate'
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`py-3 px-4 rounded-full font-mono text-xs uppercase tracking-widest transition-all border ${
                  role === 'employer'
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'
                }`}
              >
                Employer
              </button>
            </div>
          </div>
        )}

        <div className="pt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-mono text-xs text-white/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            {isLogin ? "Create Account" : 'Sign In Instead'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="group flex items-center gap-3 py-3 px-6 rounded-full bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isLogin ? 'Authenticate' : 'Initialize'}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
