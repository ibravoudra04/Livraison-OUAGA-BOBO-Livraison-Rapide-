-- =========================================================================
-- MIGRATION SÉCURITÉ V2 — À EXÉCUTER DANS L'ORDRE STRICT
-- IMPORTANT : Exécuter ce script AVANT de déployer le nouveau code
-- =========================================================================

-- =========================================================================
-- ÉTAPE 1 : Affecter le rôle admin dans app_metadata au compte administrateur
-- app_metadata ne peut PAS être modifié par l'utilisateur lui-même
-- (contrairement à user_metadata qui est librement modifiable)
-- =========================================================================
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE
  raw_user_meta_data->>'phone' LIKE '%67370909%'
  OR raw_user_meta_data->>'role' = 'admin'
  OR (raw_app_meta_data->>'role') = 'admin';

-- Vérification : doit retourner au moins une ligne avec app_role = 'admin'
SELECT id, raw_app_meta_data->>'role' AS app_role, raw_user_meta_data->>'phone' AS phone
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'admin';

-- =========================================================================
-- ÉTAPE 2 : Corriger toutes les politiques RLS pour n'utiliser QUE app_metadata
-- Suppression des conditions basées sur user_metadata (exploitables)
-- =========================================================================

-- 2a. Livreurs
DROP POLICY IF EXISTS "Admins manage all livreurs" ON public.livreurs;
CREATE POLICY "Admins manage all livreurs" ON public.livreurs
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2b. Clients
DROP POLICY IF EXISTS "Admins manage all clients" ON public.clients_livraison;
CREATE POLICY "Admins manage all clients" ON public.clients_livraison
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2c. Déblocages
DROP POLICY IF EXISTS "Admins manage all unlocks" ON public.deblocages;
CREATE POLICY "Admins manage all unlocks" ON public.deblocages
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2d. Chats
DROP POLICY IF EXISTS "Admins can manage all chats" ON public.chats_livraison;
CREATE POLICY "Admins can manage all chats" ON public.chats_livraison
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2e. Tickets support
DROP POLICY IF EXISTS "Admins manage all tickets" ON public.tickets_support;
CREATE POLICY "Admins manage all tickets" ON public.tickets_support
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2f. Annonces
DROP POLICY IF EXISTS "Admins manage annonces" ON public.annonces;
CREATE POLICY "Admins manage annonces" ON public.annonces
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2g. Paiements
DROP POLICY IF EXISTS "Admins manage paiements" ON public.paiements;
CREATE POLICY "Admins manage paiements" ON public.paiements
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- =========================================================================
-- ÉTAPE 3 : Mettre à jour la vue livreurs_view pour n'utiliser que app_metadata
-- Suppression de la condition sur user_metadata->>'phone'
-- =========================================================================
CREATE OR REPLACE VIEW public.livreurs_view AS
SELECT
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial,
    l.contacts_count, l.subscription_paid, l.status, l.views_count,
    l.rating, l.city, l.created_at, l.selfie,
    l.cni_recto, l.cni_verso, l.is_verified,
    CASE
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN l.phone
        WHEN ctx.uid = l.id THEN l.phone
        WHEN EXISTS (
            SELECT 1 FROM public.deblocages d
            WHERE d.client_id = ctx.uid AND d.rider_id = l.id
        ) THEN l.phone
        WHEN ctx.app_role = 'admin' THEN l.phone
        ELSE
            CASE
                WHEN length(l.phone) >= 8 THEN substring(l.phone from 1 for 7) || ' •• •• ••'
                ELSE '+226 •• •• •• ••'
            END
    END AS phone_display,
    CASE
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN true
        WHEN ctx.uid = l.id
           OR EXISTS (
               SELECT 1 FROM public.deblocages d
               WHERE d.client_id = ctx.uid AND d.rider_id = l.id
           )
           OR ctx.app_role = 'admin' THEN true
        ELSE false
    END AS is_unlocked
FROM public.livreurs l
CROSS JOIN (
    SELECT
        auth.uid() AS uid,
        (auth.jwt()->'app_metadata'->>'role') AS app_role
) ctx;

GRANT SELECT ON public.livreurs_view TO anon, authenticated;

-- =========================================================================
-- ÉTAPE 4 : Actions manuelles requises dans le Dashboard Supabase Storage
-- (ne peuvent pas être faites via SQL)
-- =========================================================================
-- 1. Bucket "chat_images" :
--    → Storage → chat_images → Policies
--    → Modifier la politique INSERT pour exiger TO authenticated (pas TO public)
--
-- 2. Bucket "recus-paiements" :
--    → Storage → recus-paiements → Edit bucket
--    → Décocher "Public bucket"
--    → Les reçus ne seront plus accessibles sans URL signée
-- =========================================================================
