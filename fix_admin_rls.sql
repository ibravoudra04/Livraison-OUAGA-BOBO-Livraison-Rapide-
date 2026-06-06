-- =========================================================================
-- SCRIPT DE CORRECTION DES DROITS ADMINISTRATEURS (RLS)
-- =========================================================================
-- Ce script permet aux administrateurs (dont le numéro est 67 37 09 09 ou
-- qui ont le rôle admin dans leurs metadonnées) d'accéder aux données depuis
-- le tableau de bord Admin, en contournant le problème des politiques RLS 
-- qui bloquaient l'accès.
--
-- EXÉCUTEZ CE SCRIPT DANS LE "SQL EDITOR" DE VOTRE PROJET SUPABASE
-- =========================================================================

-- 1. Correction de la politique pour les Livreurs
DROP POLICY IF EXISTS "Admins manage all livreurs" ON public.livreurs;
CREATE POLICY "Admins manage all livreurs" ON public.livreurs
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

-- 2. Correction de la politique pour les Clients
DROP POLICY IF EXISTS "Admins manage all clients" ON public.clients_livraison;
CREATE POLICY "Admins manage all clients" ON public.clients_livraison
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

-- 3. Correction de la politique pour les Déblocages
DROP POLICY IF EXISTS "Admins manage all unlocks" ON public.deblocages;
CREATE POLICY "Admins manage all unlocks" ON public.deblocages
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

-- 4. Correction de la politique pour les Chats
DROP POLICY IF EXISTS "Admins can manage all chats" ON public.chats_livraison;
CREATE POLICY "Admins can manage all chats" ON public.chats_livraison
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

-- 5. Mise à jour de la vue sécurisée
CREATE OR REPLACE VIEW public.livreurs_view AS
SELECT 
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial, l.contacts_count, l.subscription_paid, l.status, l.views_count, l.rating, l.city, l.created_at, l.selfie,
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
