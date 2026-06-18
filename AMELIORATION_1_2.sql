-- =========================================================================
-- AMÉLIORATIONS #1 et #2 (Feuille de route, 18 juin 2026)
-- À EXÉCUTER DANS : Supabase → SQL Editor → coller tout → Run
-- Sans risque : n'efface AUCUNE donnée. Ne touche pas à la table livreurs.
-- =========================================================================

-- ===== #1 — Retirer les pièces d'identité (CNI) de la vue publique =====
-- Problème : livreurs_view exposait cni_recto / cni_verso à anon+authenticated.
-- N'importe quel visiteur pouvait lire les URLs des CNI des livreurs via l'API.
-- Correction : on recrée la vue À L'IDENTIQUE mais SANS cni_recto / cni_verso.
-- L'admin continue de voir les CNI : il les lit depuis la table `livreurs`
-- (protégée par RLS admin), pas depuis cette vue.

DROP VIEW IF EXISTS public.livreurs_view CASCADE;
CREATE VIEW public.livreurs_view AS
SELECT
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial,
    l.contacts_count, l.subscription_paid, l.status, l.views_count,
    l.rating, l.city, l.created_at, l.selfie, l.is_verified,
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

-- ===== #2 — Index combiné pour le chat =====
-- La requête la plus fréquente : "messages de CE livreur AVEC CE client, triés par date".
-- Un index combiné évite que l'ouverture d'une conversation ralentisse avec le volume.
CREATE INDEX IF NOT EXISTS idx_chats_pair_created
    ON public.chats_livraison (rider_id, client_id, created_at);

-- ===== Vérifications (doivent confirmer le résultat) =====
-- 1) La vue ne doit PLUS contenir cni_recto / cni_verso :
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'livreurs_view'
ORDER BY ordinal_position;

-- 2) L'index doit apparaître :
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'chats_livraison';
-- =========================================================================
