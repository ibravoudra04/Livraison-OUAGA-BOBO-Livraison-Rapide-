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
  onChatClient: (clientId: string, clientName: string) => void;
}

export default function DriverDrawer({ isOpen, onClose, initialView = 'login', onChatClient }: DriverDrawerProps) {
  const { user, role, supabase } = useSupabaseAuth();
  
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>(initialView);
  const [driverData, setDriverData] = useState<any>(null);

  useEffect(() => {
    if (user && role === 'rider') {
      setView('dashboard');
      // Fetch driver details
      const fetchDriver = async () => {
        try {
          const { data, error } = await supabase.from('livreurs_view').select('*').eq('id', user.id).single();
          if (error) console.error("Error fetching driver:", error);
          
          if (data) {
            setDriverData(data);
          } else {
            setDriverData({
              id: user.id,
              name: user.user_metadata?.name || 'Livreur',
              vehicle: user.user_metadata?.vehicle || 'Moto',
              status: 'en attente',
              contacts_count: 0,
              views_count: 0,
              subscription_paid: false
            });
          }
        } catch (e) {
          console.error("Exception fetching driver:", e);
          setDriverData({
            id: user.id,
            name: user.user_metadata?.name || 'Livreur',
            vehicle: user.user_metadata?.vehicle || 'Moto',
            status: 'en attente',
            contacts_count: 0,
            views_count: 0,
            subscription_paid: false
          });
        }
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
          onPaySubscription={() => {
            // Paiement réel de l'abonnement livreur (500 FCFA) via Orange Money,
            // vers le numéro de la plateforme — même mécanisme que le client.
            window.location.href = "tel:*144*2*1*67370909*500%23";
          }}
          onChatClient={(clientId, clientName) => {
            onClose();
            onChatClient(clientId, clientName);
          }}
        />
      )}
    </Drawer>
  );
}
