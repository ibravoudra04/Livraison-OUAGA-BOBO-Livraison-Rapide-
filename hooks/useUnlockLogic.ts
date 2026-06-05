import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useUnlockLogic(clientId?: string) {
  const [unlockedRiders, setUnlockedRiders] = useState<Set<string>>(new Set());
  const [isUnlocking, setIsUnlocking] = useState(false);
  const supabase = createClient();

  const fetchUnlocks = async () => {
     if (!clientId) return;
     const { data, error } = await supabase.from('deblocages').select('rider_id').eq('client_id', clientId);
     if (!error && data) {
        setUnlockedRiders(new Set(data.map(d => d.rider_id)));
     }
  };

  const unlockRider = async (riderId: string, isPremium: boolean = false): Promise<{ success: boolean; error?: string }> => {
    if (!clientId) return { success: false, error: "Non connecté" };
    setIsUnlocking(true);
    
    try {
      if (isPremium) {
         const { error } = await supabase.from('deblocages').insert({ client_id: clientId, rider_id: riderId });
         if (!error) {
            setUnlockedRiders(prev => new Set(prev).add(riderId));
            return { success: true };
         } else {
            return { success: false, error: error.message };
         }
      } else {
         const { error } = await supabase.rpc('simulate_payment_unlock', { target_rider_id: riderId });
         if (!error) {
            setUnlockedRiders(prev => new Set(prev).add(riderId));
            return { success: true };
         } else {
            return { success: false, error: error.message };
         }
      }
    } catch (e: any) {
      console.error("Erreur de déblocage :", e);
      return { success: false, error: e.message };
    } finally {
      setIsUnlocking(false);
    }
  };

  return { unlockedRiders, isUnlocking, fetchUnlocks, unlockRider };
}
