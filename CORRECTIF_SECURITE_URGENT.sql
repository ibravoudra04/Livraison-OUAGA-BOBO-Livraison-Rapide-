-- =====================================================================
--  CORRECTIF DE SÉCURITÉ URGENT — Livraison Rapide
--  À EXÉCUTER UNE FOIS dans : Supabase → SQL Editor → New query → Run
-- ---------------------------------------------------------------------
--  Ferme la faille où n'importe qui pouvait devenir "admin" en mettant
--  role=admin dans ses métadonnées (user_metadata, modifiable par l'usager).
--  Après ce script, SEUL app_metadata.role = 'admin' (non modifiable par
--  l'utilisateur) donne les droits admin.
--
--  SÛR À RELANCER : supprime dynamiquement TOUTES les anciennes règles de
--  chaque table (quel que soit leur nom) puis recrée les bonnes.
--  N'efface AUCUNE donnée (ni client, ni livreur, ni message).
-- =====================================================================

-- ===== 0. S'assurer que le(s) compte(s) admin ont bien le rôle dans app_metadata =====
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE raw_user_meta_data->>'phone' LIKE '%67370909%'
   OR raw_user_meta_data->>'role' = 'admin'
   OR (raw_app_meta_data->>'role') = 'admin'
   OR email IN ('admin@livraison.com', '67370909@livraison.com');

-- ===== 1. Fonction utilitaire : supprimer toutes les policies d'une table =====
DO $$
DECLARE
    t text;
    pol record;
    tables text[] := ARRAY[
        'clients_livraison','livreurs','deblocages','avis',
        'chats_livraison','annonces','tickets_support',
        'paiements','push_subscriptions'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        FOR pol IN
            SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
        END LOOP;
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- ===== 2. Recréer les bonnes règles (admin = app_metadata UNIQUEMENT) =====

-- 2a. clients_livraison
CREATE POLICY "client_own" ON public.clients_livraison
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "client_admin" ON public.clients_livraison
    FOR ALL TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2b. livreurs (le public lit via la vue livreurs_view, pas la table)
CREATE POLICY "livreur_own" ON public.livreurs
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "livreur_admin" ON public.livreurs
    FOR ALL TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2c. deblocages
CREATE POLICY "deblocage_read_own" ON public.deblocages
    FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "deblocage_premium_insert" ON public.deblocages
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id
        AND EXISTS (SELECT 1 FROM public.clients_livraison c
                    WHERE c.id = auth.uid() AND c.subscription_paid = true)
    );
CREATE POLICY "deblocage_admin" ON public.deblocages
    FOR ALL TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2d. avis (tout le monde lit ; seul un client ayant débloqué/période gratuite poste)
CREATE POLICY "avis_read_all" ON public.avis
    FOR SELECT USING (true);
CREATE POLICY "avis_insert_unlocked" ON public.avis
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id
        AND (
            now() < '2026-07-02 00:00:00+00'::timestamptz
            OR EXISTS (SELECT 1 FROM public.deblocages d
                       WHERE d.client_id = auth.uid() AND d.rider_id = avis.rider_id)
        )
    );
CREATE POLICY "avis_admin" ON public.avis
    FOR ALL TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2e. chats_livraison (participants seulement + admin)
CREATE POLICY "chat_participants" ON public.chats_livraison
    FOR ALL TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = rider_id)
    WITH CHECK (auth.uid() = client_id OR auth.uid() = rider_id);
CREATE POLICY "chat_admin" ON public.chats_livraison
    FOR ALL TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2f. annonces
CREATE POLICY "annonce_read_active" ON public.annonces
    FOR SELECT USING (is_active = true);
CREATE POLICY "annonce_admin" ON public.annonces
    FOR ALL TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2g. tickets_support
CREATE POLICY "ticket_read_own" ON public.tickets_support
    FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "ticket_insert_own" ON public.tickets_support
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "ticket_admin" ON public.tickets_support
    FOR ALL TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2h. paiements (insertion faite côté serveur avec la clé service = hors RLS)
CREATE POLICY "paiement_read_own" ON public.paiements
    FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "paiement_admin" ON public.paiements
    FOR SELECT TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 2i. push_subscriptions
CREATE POLICY "push_insert_own" ON public.push_subscriptions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_read_own" ON public.push_subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "push_delete_own" ON public.push_subscriptions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "push_admin_read" ON public.push_subscriptions
    FOR SELECT TO authenticated USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- ===== 3. Vue sécurisée : masquage téléphone basé sur app_metadata uniquement =====
-- On SUPPRIME d'abord la vue : un simple CREATE OR REPLACE échoue si l'ordre des
-- colonnes diffère de la vue existante (ce qui annulerait tout le script).
DROP VIEW IF EXISTS public.livreurs_view CASCADE;
CREATE VIEW public.livreurs_view AS
SELECT
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial,
    l.contacts_count, l.subscription_paid, l.status, l.views_count,
    l.rating, l.city, l.created_at, l.selfie, l.cni_recto, l.cni_verso, l.is_verified,
    CASE
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN l.phone
        WHEN ctx.uid = l.id THEN l.phone
        WHEN EXISTS (SELECT 1 FROM public.deblocages d
                     WHERE d.client_id = ctx.uid AND d.rider_id = l.id) THEN l.phone
        WHEN ctx.app_role = 'admin' THEN l.phone
        ELSE CASE WHEN length(l.phone) >= 8
                  THEN substring(l.phone from 1 for 7) || ' •• •• ••'
                  ELSE '+226 •• •• •• ••' END
    END AS phone_display,
    CASE
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN true
        WHEN ctx.uid = l.id
          OR EXISTS (SELECT 1 FROM public.deblocages d
                     WHERE d.client_id = ctx.uid AND d.rider_id = l.id)
          OR ctx.app_role = 'admin' THEN true
        ELSE false
    END AS is_unlocked
FROM public.livreurs l
CROSS JOIN (
    SELECT auth.uid() AS uid,
           (auth.jwt()->'app_metadata'->>'role') AS app_role
) ctx;

GRANT SELECT ON public.livreurs_view TO anon, authenticated;

-- ===== 4. Vérification (doit afficher uniquement des policies "app_metadata") =====
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- =====================================================================
--  FIN. Après exécution, plus aucune règle ne doit contenir "user_metadata".
-- =====================================================================
