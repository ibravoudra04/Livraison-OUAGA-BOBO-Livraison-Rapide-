-- Création de la table pour suivre les visites uniques par session
CREATE TABLE IF NOT EXISTS public.plateforme_visites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activation de RLS
ALTER TABLE public.plateforme_visites ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde (même les non-authentifiés) à insérer une visite
CREATE POLICY "Anyone can insert visit" ON public.plateforme_visites
    FOR INSERT WITH CHECK (true);

-- Seul l'admin peut lire les visites
CREATE POLICY "Admins can read visits" ON public.plateforme_visites
    FOR SELECT TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin'
    );

-- Index pour la rapidité des filtres par date
CREATE INDEX IF NOT EXISTS idx_visites_created_at ON public.plateforme_visites(created_at DESC);
