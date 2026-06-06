-- =========================================================================
-- MIGRATION SQL : AJOUT DES FONCTIONNALITÉS KYC, ANNONCES ET LITIGES
-- =========================================================================
-- Copiez-collez l'intégralité de ce script dans l'éditeur SQL de votre projet Supabase
-- et exécutez-le pour mettre à jour votre base de données.
-- =========================================================================

-- 1. Ajout du badge KYC "Vérifié" pour les livreurs
ALTER TABLE public.livreurs ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Recréation de la vue sécurisée (pour inclure is_verified)
DROP VIEW IF EXISTS public.livreurs_view CASCADE;
CREATE OR REPLACE VIEW public.livreurs_view AS
SELECT 
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial, l.contacts_count, l.subscription_paid, l.status, l.views_count, l.rating, l.city, l.created_at, l.selfie, l.is_verified,
    CASE 
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN l.phone
        WHEN ctx.uid = l.id THEN l.phone
        WHEN EXISTS (
            SELECT 1 FROM public.deblocages d 
            WHERE d.client_id = ctx.uid AND d.rider_id = l.id
        ) THEN l.phone
        WHEN ctx.role = 'admin' OR ctx.user_role = 'admin' OR ctx.user_phone LIKE '%67370909%' THEN l.phone
        ELSE 
            CASE 
                WHEN length(l.phone) >= 8 THEN substring(l.phone from 1 for 7) || ' •• •• ••'
                ELSE '+226 •• •• •• ••'
            END
    END as phone_display,
    CASE 
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN true
        WHEN ctx.uid = l.id 
           OR EXISTS (
               SELECT 1 FROM public.deblocages d 
               WHERE d.client_id = ctx.uid AND d.rider_id = l.id
           ) 
           OR ctx.role = 'admin' OR ctx.user_role = 'admin' OR ctx.user_phone LIKE '%67370909%' THEN true
        ELSE false
    END as is_unlocked
FROM public.livreurs l
CROSS JOIN (
    SELECT 
        auth.uid() as uid, 
        (auth.jwt()->'app_metadata'->>'role') as role,
        (auth.jwt()->'user_metadata'->>'role') as user_role,
        (auth.jwt()->'user_metadata'->>'phone') as user_phone
) ctx;

GRANT SELECT ON public.livreurs_view TO anon, authenticated;

-- 3. Table des Annonces Globales
CREATE TABLE IF NOT EXISTS public.annonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active annonces" ON public.annonces;
CREATE POLICY "Anyone can read active annonces" ON public.annonces
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage annonces" ON public.annonces;
CREATE POLICY "Admins manage annonces" ON public.annonces
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

-- 4. Table des Litiges (Tickets Support)
CREATE TABLE IF NOT EXISTS public.tickets_support (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients_livraison(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES public.livreurs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'resolu')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets_support ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients read own tickets" ON public.tickets_support;
CREATE POLICY "Clients read own tickets" ON public.tickets_support
    FOR SELECT TO authenticated USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients insert tickets" ON public.tickets_support;
CREATE POLICY "Clients insert tickets" ON public.tickets_support
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Admins manage all tickets" ON public.tickets_support;
CREATE POLICY "Admins manage all tickets" ON public.tickets_support
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_annonces_active ON public.annonces(is_active);
CREATE INDEX IF NOT EXISTS idx_tickets_statut ON public.tickets_support(statut);
