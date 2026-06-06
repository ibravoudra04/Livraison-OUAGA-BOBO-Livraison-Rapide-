-- =========================================================================
-- SCRIPT DE CORRECTION POUR L'AFFICHAGE DES PHOTOS (CNI / SELFIE)
-- =========================================================================
-- Explication : Les photos uploadées lors de l'inscription sont stockées
-- dans un bucket appelé "identities". Par défaut, Supabase crée ce bucket 
-- en mode privé, ce qui empêche le navigateur web de télécharger et 
-- d'afficher l'image lorsque l'administrateur clique sur un profil.
--
-- EXÉCUTEZ CE SCRIPT DANS LE "SQL EDITOR" DE VOTRE PROJET SUPABASE
-- =========================================================================

-- 1. Rendre le bucket 'identities' public (s'il existe déjà)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'identities';

-- 2. Créer une politique (Policy) pour autoriser la lecture publique des fichiers 
-- de ce bucket. Si elle existe déjà, ce n'est pas grave, cela va juste s'ajouter.
DROP POLICY IF EXISTS "Public Access to Identities" ON storage.objects;
CREATE POLICY "Public Access to Identities" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'identities');
