import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface AppSettings {
  support_whatsapp: string;
  support_phone: string;
  welcome_text: string;
}

// Valeurs par défaut = ce qui était codé en dur avant.
// L'app fonctionne donc normalement même si la table parametres_app
// n'a pas encore été créée (script AJOUT_PARAMETRES_APP.sql).
export const DEFAULT_SETTINGS: AppSettings = {
  support_whatsapp: '22667370909',
  support_phone: '+22667370909',
  welcome_text: 'Visualisez les livreurs actifs autour de vous.',
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data, error } = await supabase.from('parametres_app').select('key, value');
        if (!error && data && data.length > 0) {
          setSettings(prev => {
            const next = { ...prev };
            for (const row of data) {
              if (row.key in next && row.value) {
                (next as any)[row.key] = row.value;
              }
            }
            return next;
          });
        }
      } catch {
        // table absente → on garde les valeurs par défaut
      }
    })();
  }, []);

  return settings;
}
