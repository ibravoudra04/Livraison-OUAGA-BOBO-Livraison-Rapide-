-- =========================================================================
-- MIGRATION SQL : ACTIVATION DU TEMPS RÉEL (REALTIME) POUR LE CHAT
-- =========================================================================

-- Activer le temps réel pour la table chats_livraison
-- Supabase exige d'ajouter la table à la publication 'supabase_realtime'
-- pour que les clients reçoivent les événements de type INSERT/UPDATE/DELETE.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chats_livraison'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chats_livraison;
    END IF;
END $$;

COMMIT;
