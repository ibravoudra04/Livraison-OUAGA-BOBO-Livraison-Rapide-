import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'client' | 'rider' | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
         setRole(session.user.app_metadata?.role || null);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
         setRole(session.user.app_metadata?.role || null);
      } else {
         setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const formatPhoneForDB = (phone: string) => {
    let p = phone.replace(/\s+/g, '').replace('+', '');
    if (p.startsWith('226')) p = p.substring(3);
    return '+226 ' + p.match(/.{1,2}/g)?.join(' ') || p;
  };

  const loginWithPhone = async (phone: string, pin: string) => {
    const phoneNormalized = formatPhoneForDB(phone);
    const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
    const securePassword = pin.length < 6 ? pin + "_secure_pad" : pin;

    return await supabase.auth.signInWithPassword({
      email: virtualEmail,
      password: securePassword
    });
  };

  const logout = async () => {
    return await supabase.auth.signOut();
  };

  return { user, session, loading, role, supabase, loginWithPhone, logout, formatPhoneForDB };
}
