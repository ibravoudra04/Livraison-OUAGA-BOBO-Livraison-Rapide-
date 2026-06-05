-- =========================================================================
-- Script SQL pour forcer la création et l'activation des comptes utilisateurs
-- À exécuter dans l'éditeur SQL de votre tableau de bord Supabase
-- =========================================================================

-- Note: Dans Supabase, l'insertion directe dans auth.users est bloquée 
-- par défaut pour des raisons de sécurité. 
-- La MEILLEURE méthode est que vous vous inscriviez normalement depuis 
-- l'application (via les formulaires que nous venons d'activer), 
-- puis d'utiliser les requêtes UPDATE ci-dessous pour forcer leurs rôles si nécessaire.

-- =========================================================================
-- 1. APRES AVOIR CREE LES COMPTES DEPUIS L'APP, EXECUTEZ CES REQUETES :
-- =========================================================================

-- Forcer le compte "67 37 09 09" à devenir Administrateur
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
WHERE email = '22667370909@livraison.com';

-- Forcer le compte "70 99 99 99" à devenir Client Premium
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"client"')
WHERE email = '22670999999@livraison.com';

UPDATE public.clients_livraison
SET subscription_paid = true
WHERE phone = '70999999';

-- Forcer le compte "76 45 82 10" à devenir Livreur approuvé
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"rider"')
WHERE email = '22676458210@livraison.com';

UPDATE public.livreurs
SET status = 'approved', is_online = true
WHERE phone = '76458210';
