-- Exécuter ce script dans le SQL Editor de Supabase pour configurer le stockage des documents d'identité

-- 1. Créer le bucket 'identities' pour stocker les CNI et Selfies
INSERT INTO storage.buckets (id, name, public)
VALUES ('identities', 'identities', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Autoriser les utilisateurs authentifiés à uploader leurs propres documents (Insert)
CREATE POLICY "Livreurs can upload documents" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'identities' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Autoriser les administrateurs à lire tous les documents
CREATE POLICY "Admins can read all documents" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'identities' AND (auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 4. Autoriser les utilisateurs à lire leurs propres documents
CREATE POLICY "Livreurs can read own documents" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'identities' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Créer le bucket 'chat_images' pour les photos de la messagerie
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_images', 'chat_images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Autoriser tout le monde à uploader et lire des images de chat
CREATE POLICY "Public Chat Images Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'chat_images');
CREATE POLICY "Public Chat Images Read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat_images');
