-- Création de la table 'paiements' pour stocker les IDs de transaction et éviter les doubles paiements
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT UNIQUE NOT NULL,
    montant NUMERIC NOT NULL,
    statut TEXT NOT NULL DEFAULT 'VALIDE',
    image_url TEXT,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de la sécurité RLS
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (RLS)
-- L'admin peut voir tous les paiements via JWT role
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les paiements" ON public.paiements;
CREATE POLICY "Les administrateurs peuvent voir tous les paiements" 
ON public.paiements FOR SELECT 
USING (
  (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
  (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
  (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
);

-- Les clients peuvent voir leurs propres paiements
DROP POLICY IF EXISTS "Les clients voient leurs propres paiements" ON public.paiements;
CREATE POLICY "Les clients voient leurs propres paiements" 
ON public.paiements FOR SELECT 
USING (
  client_id = auth.uid()
);

-- Création du bucket de stockage 'recus-paiements'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recus-paiements', 'recus-paiements', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket 'recus-paiements'
DROP POLICY IF EXISTS "L'admin peut lire les reçus" ON storage.objects;
CREATE POLICY "L'admin peut lire les reçus"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recus-paiements' AND (
    (auth.jwt()->'app_metadata'->>'role') = 'admin' OR
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  )
);

DROP POLICY IF EXISTS "Lecture publique des reçus" ON storage.objects;
CREATE POLICY "Lecture publique des reçus"
ON storage.objects FOR SELECT
USING (bucket_id = 'recus-paiements');
