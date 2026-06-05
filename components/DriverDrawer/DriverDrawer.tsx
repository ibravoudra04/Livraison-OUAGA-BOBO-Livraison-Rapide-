import React, { useState, useEffect } from 'react';
import Drawer from '@/components/Drawer/Drawer';
import DriverLogin from './DriverLogin';
import DriverRegistration from './DriverRegistration';
import DriverDashboard from './DriverDashboard';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface DriverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'dashboard';
}

export default function DriverDrawer({ isOpen, onClose, initialView = 'login' }: DriverDrawerProps) {
  const { user, role, supabase } = useSupabaseAuth();
  
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>(initialView);
  const [driverData, setDriverData] = useState<any>(null);

  useEffect(() => {
    if (user && role === 'rider') {
      setView('dashboard');
      // Fetch driver details
      const fetchDriver = async () => {
        const { data } = await supabase.from('livreurs_view').select('*').eq('id', user.id).single();
        if (data) setDriverData(data);
      };
      fetchDriver();
    } else if (user) {
      if (role === 'admin' || role === 'client') {
        onClose();
      }
    } else if (!user && isOpen) {
      setView(initialView);
    }
  }, [user, role, supabase, isOpen, initialView]);

  const getTitle = () => {
    if (view === 'dashboard') return 'Mon Espace Livreur';
    if (view === 'login') return 'Connexion Livreur';
    return 'Rejoindre l\'équipe';
  };

  return (
    <Drawer id="driver-drawer" isOpen={isOpen} onClose={onClose} title={getTitle()}>
      {view === 'register' && (
        <DriverRegistration 
          onGoToLogin={() => setView('login')} 
          onSuccess={() => setView('dashboard')} 
        />
      )}
      
      {view === 'login' && (
        <DriverLogin 
          onGoToRegister={() => setView('register')} 
          onSuccess={() => setView('dashboard')} 
        />
      )}
      
      {view === 'dashboard' && (
        <DriverDashboard 
          driverData={driverData} 
          onLogout={() => setView('login')}
          onSimulatePayment={() => alert("Simulation Paiement...")}
        />
      )}
    </Drawer>
  );
}
