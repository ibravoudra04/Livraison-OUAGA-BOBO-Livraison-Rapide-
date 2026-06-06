import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface AdminStats {
  totalUnlocks: number;
  totalRevenue: number;
  totalDrivers: number;
  totalClients: number;
  totalPremium: number;
  totalMessages: number;
  pendingDrivers: any[];
  allChats: any[];
  allDrivers: any[];
}

export function useAdminStats(isAdmin: boolean) {
  const [stats, setStats] = useState<AdminStats>({
    totalUnlocks: 0,
    totalRevenue: 0,
    totalDrivers: 0,
    totalClients: 0,
    totalPremium: 0,
    totalMessages: 0,
    pendingDrivers: [],
    allChats: [],
    allDrivers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch total unlocks
        const { count: unlocksCount, error: unlocksError } = await supabase
          .from('deblocages')
          .select('*', { count: 'exact', head: true });
        
        if (unlocksError) throw unlocksError;

        // Fetch total drivers
        const { count: driversCount, error: driversError } = await supabase
          .from('livreurs')
          .select('*', { count: 'exact', head: true });
        
        if (driversError) throw driversError;

        // Fetch pending drivers
        const { data: pending, error: pendingError } = await supabase
          .from('livreurs')
          .select('*')
          .eq('status', 'pending');
        
        if (pendingError) throw pendingError;

        // Fetch total messages
        const { count: messagesCount, error: messagesError } = await supabase
          .from('chats_livraison')
          .select('*', { count: 'exact', head: true });
        
        if (messagesError) throw messagesError;

        // Fetch chats for inspector
        const { data: chats, error: chatsError } = await supabase
          .from('chats_livraison')
          .select(`*, livreurs (name), clients_livraison (name)`)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (chatsError) throw chatsError;

        // Fetch all drivers for management
        const { data: allDriversData, error: allDriversError } = await supabase
          .from('livreurs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (allDriversError) throw allDriversError;

        setStats({
          totalUnlocks: unlocksCount || 0,
          totalRevenue: (unlocksCount || 0) * 200,
          totalDrivers: driversCount || 0,
          totalClients: 0,
          totalPremium: 0,
          totalMessages: messagesCount || 0,
          pendingDrivers: pending || [],
          allChats: chats || [],
          allDrivers: allDriversData || []
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, supabase]);

  const approveDriver = async (driverId: string) => {
    const { error } = await supabase
      .from('livreurs')
      .update({ status: 'actif', is_online: true })
      .eq('id', driverId);
    
    if (error) {
      setError(error.message);
      return false;
    }
    
    // Optimistic update
    setStats(prev => ({
      ...prev,
      pendingDrivers: prev.pendingDrivers.filter(d => d.id !== driverId),
      allDrivers: prev.allDrivers.map(d => d.id === driverId ? { ...d, status: 'actif', is_online: true } : d)
    }));
    return true;
  };

  const deleteDriver = async (driverId: string) => {
    const { error } = await supabase
      .from('livreurs')
      .delete()
      .eq('id', driverId);
    
    if (error) {
      setError(error.message);
      return false;
    }
    
    setStats(prev => ({
      ...prev,
      pendingDrivers: prev.pendingDrivers.filter(d => d.id !== driverId),
      allDrivers: prev.allDrivers.filter(d => d.id !== driverId),
      totalDrivers: prev.totalDrivers - 1
    }));
    return true;
  };

  const suspendDriver = async (driverId: string) => {
    const { error } = await supabase
      .from('livreurs')
      .update({ status: 'suspendu', is_online: false })
      .eq('id', driverId);
    
    if (error) {
      setError(error.message);
      return false;
    }
    
    setStats(prev => ({
      ...prev,
      allDrivers: prev.allDrivers.map(d => d.id === driverId ? { ...d, status: 'suspendu', is_online: false } : d)
    }));
    return true;
  };

  return { stats, loading, error, approveDriver, suspendDriver, deleteDriver };
}
