-- ============================================
-- MIGRATION : Réparation complète du Chat
-- ============================================
-- 1. Ajouter la colonne image_url manquante
-- 2. S'assurer que le Realtime est actif

-- Ajout de la colonne image_url
ALTER TABLE public.chats_livraison
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Vérifier que la table est dans la publication Realtime
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

-- Confirmation : Afficher les colonnes de la table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chats_livraison' 
ORDER BY ordinal_position;
