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
      
      const { data, error } = await query;
      if (!error && data) {
        setLivreurs(data);
      }
      setLoading(false);
    };

    fetchLivreurs();

    const channel = supabase.channel('livreurs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'livreurs' },
        (_payload) => {
          fetchLivreurs(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [city, supabase]);

  return { livreurs, loading, setLivreurs };
}
