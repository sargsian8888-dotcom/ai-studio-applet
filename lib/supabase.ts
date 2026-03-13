import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client using environment variables.
// These should be set in your .env.local file.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkydmpptilinjuekmfnb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhreWRtcHB0aWxpbmp1ZWttZm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjAyODMsImV4cCI6MjA4ODgzNjI4M30.61NxQtih8FB3XrpKOAtAvc14H1HT7AC4I3ggWDkGIbo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
