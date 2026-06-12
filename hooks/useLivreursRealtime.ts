import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useLivreursRealtime(city?: string) {
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLivreurs = async () => {
      setLoading(true);
      let query = supabase.from('livreurs_view').select('*');
      
      if (city) {
         const dbCity = city === 'Ouagadougou' ? 'ouaga' : (city === 'Bobo-Dioulasso' ? 'bobo' : city);
         query = query.eq('city', dbCity);
      }
      
      // Filtrer uniquement les livreurs actifs/approuvés pour qu'ils s'affichent sur la carte
      query = query.in('status', ['actif', 'approved']);
      
      const { data, error } = await query;
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
              const { data } = await supabase.from('livreurs_view').select('*').eq('id', newRecord.id).single();
              if (data) {
                setLivreurs(prev => {
                  if (!prev.some(l => l.id === data.id)) return [...prev, data];
                  return prev;
                });
              }
            }
          }

          if (payload.eventType === 'INSERT' && isActive) {
            const { data } = await supabase.from('livreurs_view').select('*').eq('id', newRecord.id).single();
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
