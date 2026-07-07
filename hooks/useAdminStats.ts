import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface DailyStat {
  date: string;
  label: string;
  newDrivers: number;
  newClients: number;
  messages: number;
  payments: number;
}

export interface AdminStats {
  totalUnlocks: number;
  totalRevenue: number;
  totalRevenuePaid: number;
  totalDrivers: number;
  totalClients: number;
  totalPremium: number;
  totalMessages: number;
  ouagaDrivers: number;
  boboDrivers: number;
  pendingDrivers: any[];
  allChats: any[];
  allDrivers: any[];
  allClients: any[];
  allDeblocages: any[];
  annonces: any[];
  tickets: any[];
  allAvis: any[];
  paiements: any[];
  allVisits: any[];
  dailyStats: DailyStat[];
}

export function useAdminStats(isAdmin: boolean) {
  const [stats, setStats] = useState<AdminStats>({
    totalUnlocks: 0,
    totalRevenue: 0,
    totalRevenuePaid: 0,
    totalDrivers: 0,
    totalClients: 0,
    totalPremium: 0,
    totalMessages: 0,
    ouagaDrivers: 0,
    boboDrivers: 0,
    pendingDrivers: [],
    allChats: [],
    allDrivers: [],
    allClients: [],
    allDeblocages: [],
    annonces: [],
    tickets: [],
    allAvis: [],
    paiements: [],
    allVisits: [],
    dailyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchStats = async () => {
      setLoading(true);
      const timeout = setTimeout(() => { setLoading(false); setError('Délai dépassé.'); }, 15000);
      try {
        // Requêtes indépendantes — chaque erreur est ignorée individuellement
        const safe = (query: PromiseLike<any>) =>
          Promise.resolve(query).catch(() => ({ data: null, count: null, error: null }));

        const [
          r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11
        ] = await Promise.all([
          safe(supabase.from('deblocages').select('created_at').order('created_at', { ascending: false })),
          safe(supabase.from('livreurs').select('*', { count: 'exact', head: true })),
          safe(supabase.from('livreurs').select('*').eq('status', 'en attente')),
          safe(supabase.from('chats_livraison').select('created_at').order('created_at', { ascending: false })),
          safe(supabase.from('chats_livraison').select('*, livreurs(name), clients_livraison(name)').order('created_at', { ascending: false }).limit(50)),
          safe(supabase.from('livreurs').select('*').order('created_at', { ascending: false })),
          safe(supabase.from('clients_livraison').select('*', { count: 'exact' }).order('created_at', { ascending: false })),
          safe(supabase.from('tickets_support').select('*, clients_livraison(name, phone), livreurs(name, phone)').order('created_at', { ascending: false })),
          safe(supabase.from('annonces').select('*').order('created_at', { ascending: false })),
          safe(supabase.from('paiements').select('*').order('created_at', { ascending: false })),
          safe(supabase.from('plateforme_visites').select('created_at').order('created_at', { ascending: false })),
          safe(supabase.from('avis').select('*, livreurs(name, phone), clients_livraison(name, phone)').order('created_at', { ascending: false })),
        ]);

        const allDeblocagesData = r0.data || [];
        const unlocksCount  = allDeblocagesData.length;
        const driversCount  = r1.count;
        const pending       = r2.data;
        const allChatsData  = r3.data || [];
        const messagesCount = allChatsData.length;
        const chats         = r4.data;
        const allDriversData = r5.data;
        const allClientsData = r6.data;
        const clientsCount   = r6.count;
        const ticketsData   = r7.data;
        const annoncesData  = r8.data;
        const paiementsData = r9.data;
        const visitsData    = r10.data || [];
        const avisData      = r11.data || [];

        // Compute daily stats for last 14 days (utilise allChatsData déjà chargé)
        const dailyStatsArr: DailyStat[] = [];
        for (let i = 13; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          dailyStatsArr.push({
            date: dateStr,
            label: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            newDrivers: (allDriversData || []).filter(d => d.created_at?.startsWith(dateStr)).length,
            newClients: (allClientsData || []).filter(c => c.created_at?.startsWith(dateStr)).length,
            messages: allChatsData.filter((m: any) => m.created_at?.startsWith(dateStr)).length,
            payments: (paiementsData || []).filter(p => p.created_at?.startsWith(dateStr) && p.statut === 'VALIDE').length,
          });
        }

        const totalRevenuePaid = (paiementsData || [])
          .filter(p => p.statut === 'VALIDE')
          .reduce((acc, p) => acc + (Number(p.montant) || 0), 0);

        const ouagaDrivers = (allDriversData || []).filter(d => d.city === 'ouaga').length;
        const boboDrivers = (allDriversData || []).filter(d => d.city === 'bobo').length;

        setStats({
          totalUnlocks: unlocksCount || 0,
          totalRevenue: (unlocksCount || 0) * 500,
          totalRevenuePaid,
          totalDrivers: driversCount || 0,
          totalClients: clientsCount || 0,
          totalPremium: allClientsData?.filter(c => c.subscription_paid)?.length || 0,
          totalMessages: messagesCount || 0,
          ouagaDrivers,
          boboDrivers,
          pendingDrivers: pending || [],
          allChats: chats || [],
          allDrivers: allDriversData || [],
          allClients: allClientsData || [],
          allDeblocages: allDeblocagesData,
          annonces: annoncesData || [],
          tickets: ticketsData || [],
          allAvis: avisData,
          paiements: paiementsData || [],
          allVisits: visitsData,
          dailyStats: dailyStatsArr,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const approveDriver = async (driverId: string) => {
    const { error } = await supabase.from('livreurs').update({ status: 'actif' }).eq('id', driverId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      pendingDrivers: prev.pendingDrivers.filter(d => d.id !== driverId),
      allDrivers: prev.allDrivers.map(d => d.id === driverId ? { ...d, status: 'actif' } : d),
    }));
    return true;
  };

  const deleteDriver = async (driverId: string) => {
    const { error } = await supabase.from('livreurs').delete().eq('id', driverId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      pendingDrivers: prev.pendingDrivers.filter(d => d.id !== driverId),
      allDrivers: prev.allDrivers.filter(d => d.id !== driverId),
      totalDrivers: prev.totalDrivers - 1,
    }));
    return true;
  };

  const suspendDriver = async (driverId: string) => {
    const { error } = await supabase.from('livreurs').update({ status: 'suspendu' }).eq('id', driverId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      allDrivers: prev.allDrivers.map(d => d.id === driverId ? { ...d, status: 'suspendu' } : d),
    }));
    return true;
  };

  const verifyDriver = async (driverId: string, isVerified: boolean) => {
    const { error } = await supabase.from('livreurs').update({ is_verified: isVerified }).eq('id', driverId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      allDrivers: prev.allDrivers.map(d => d.id === driverId ? { ...d, is_verified: isVerified } : d),
    }));
    return true;
  };

  const toggleClientPremium = async (clientId: string, newStatus: boolean) => {
    const { error } = await supabase.from('clients_livraison').update({ subscription_paid: newStatus }).eq('id', clientId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      allClients: prev.allClients.map(c => c.id === clientId ? { ...c, subscription_paid: newStatus } : c),
      totalPremium: prev.allClients.filter(c => c.id === clientId ? newStatus : c.subscription_paid).length,
    }));
    return true;
  };

  const deleteClient = async (clientId: string) => {
    const { error } = await supabase.from('clients_livraison').delete().eq('id', clientId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      allClients: prev.allClients.filter(c => c.id !== clientId),
      totalClients: prev.totalClients - 1,
    }));
    return true;
  };

  const createAnnonce = async (message: string) => {
    await supabase.from('annonces').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('annonces').insert([{ message, is_active: true }]);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const deactivateAnnonce = async (annonceId: string) => {
    const { error } = await supabase.from('annonces').update({ is_active: false }).eq('id', annonceId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      annonces: prev.annonces.map(a => a.id === annonceId ? { ...a, is_active: false } : a),
    }));
    return true;
  };

  const resolveTicket = async (ticketId: string) => {
    const { error } = await supabase.from('tickets_support').update({ statut: 'resolu' }).eq('id', ticketId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? { ...t, statut: 'resolu' } : t),
    }));
    return true;
  };

  const reopenTicket = async (ticketId: string) => {
    const { error } = await supabase.from('tickets_support').update({ statut: 'ouvert' }).eq('id', ticketId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? { ...t, statut: 'ouvert' } : t),
    }));
    return true;
  };

  const deleteTicket = async (ticketId: string) => {
    const { error } = await supabase.from('tickets_support').delete().eq('id', ticketId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      tickets: prev.tickets.filter(t => t.id !== ticketId),
    }));
    return true;
  };

  // Synchronise l'état local après une modification faite via une route API
  // serveur (edition de fiche, création de livreur par l'admin).
  const applyDriverPatch = (driverId: string, patch: Record<string, any>) => {
    setStats(prev => ({
      ...prev,
      allDrivers: prev.allDrivers.map(d => d.id === driverId ? { ...d, ...patch } : d),
      pendingDrivers: prev.pendingDrivers.map(d => d.id === driverId ? { ...d, ...patch } : d),
    }));
  };

  const addDriverLocal = (driver: any) => {
    if (!driver?.id) return;
    setStats(prev => ({
      ...prev,
      allDrivers: [driver, ...prev.allDrivers.filter(d => d.id !== driver.id)],
      pendingDrivers: driver.status === 'en attente'
        ? [driver, ...prev.pendingDrivers.filter(d => d.id !== driver.id)]
        : prev.pendingDrivers.filter(d => d.id !== driver.id),
      totalDrivers: prev.allDrivers.some(d => d.id === driver.id) ? prev.totalDrivers : prev.totalDrivers + 1,
    }));
  };

  const deleteAvis = async (avisId: string) => {
    const { error } = await supabase.from('avis').delete().eq('id', avisId);
    if (error) { setError(error.message); return false; }
    setStats(prev => ({
      ...prev,
      allAvis: prev.allAvis.filter(a => a.id !== avisId),
    }));
    return true;
  };

  return {
    stats, loading, error,
    approveDriver, suspendDriver, deleteDriver, verifyDriver,
    toggleClientPremium, deleteClient,
    createAnnonce, deactivateAnnonce,
    resolveTicket, reopenTicket, deleteTicket, deleteAvis,
    applyDriverPatch, addDriverLocal,
  };
}
