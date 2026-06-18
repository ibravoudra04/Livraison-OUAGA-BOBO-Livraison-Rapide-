import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// Colonnes envoyées au navigateur du visiteur pour la carte publique.
// IMPORTANT : on n'inclut JAMAIS cni_recto / cni_verso ici — ce sont les pièces
// d'identité des livreurs et elles ne doivent pas quitter l'espace admin.
// (Avant, un select('*') exposait ces URLs à tout visiteur de la carte.)
const LIVREUR_PUBLIC_COLUMNS =
  'id, name, vehicle, lat, lng, initial, contacts_count, subscription_paid, status, views_count, rating, city, created_at, selfie, is_verified, phone_display, is_unlocked';

export function useLivreursRealtime(city?: string) {
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLivreurs = async () => {
      setLoading(true);
      let query = supabase.from('livreurs_view').select(LIVREUR_PUBLIC_COLUMNS);
      
      if (city) {
         const dbCity = city === 'Ouagadougou' ? 'ouaga' : (city === 'Bobo-Dioulasso' ? 'bobo' : city);
         query = query.eq('city', dbCity);
      }
      
      // Filtrer uniquement les livreurs actifs/approuvés pour qu'ils s'affichent sur la carte
      query = query.in('status', ['actif', 'approved']);
      
      const { data, error } = await query;
      console.log('fetchLivreurs response:', { dataLength: data?.length, error, city });
      if (error) {
        console.error('Erreur fetchLivreurs:', error);
      }
      if (!error && data) {
        setLivreurs(data);
      }
      setLoading(false);
    };

    fetchLivreurs();

    const channelName = `livreurs_changes_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'livreurs' },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setLivreurs(prev => prev.filter(l => l.id !== payload.old.id));
            return;
          }

          const newRecord = payload.new;
          const isActive = ['actif', 'approved'].includes(newRecord.status);

          if (payload.eventType === 'UPDATE') {
            setLivreurs(prev => {
              const exists = prev.some(l => l.id === newRecord.id);
              if (exists) {
                if (!isActive) return prev.filter(l => l.id !== newRecord.id);
                return prev.map(l => l.id === newRecord.id ? { ...l, ...newRecord } : l);
              }
              return prev;
            });

            // Si le livreur passe en ligne (il n'était pas dans la liste), on fetch ses infos complètes via la vue
            if (isActive) {
              const { data } = await supabase.from('livreurs_view').select(LIVREUR_PUBLIC_COLUMNS).eq('id', newRecord.id).single();
              if (data) {
                setLivreurs(prev => {
                  if (!prev.some(l => l.id === data.id)) return [...prev, data];
                  return prev;
                });
              }
            }
          }

          if (payload.eventType === 'INSERT' && isActive) {
            const { data } = await supabase.from('livreurs_view').select(LIVREUR_PUBLIC_COLUMNS).eq('id', newRecord.id).single();
            if (data) {
              setLivreurs(prev => [...prev, data]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [city, supabase]);

  return { livreurs, loading, setLivreurs };
}
