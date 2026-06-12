-- =====================================================================
-- SCRIPT DE RÉPARATION DES "LIVREURS FANTÔMES"
-- À exécuter dans : Supabase → SQL Editor → New query → Run
-- Ce script insère manuellement les livreurs qui ont été créés dans auth.users 
-- mais qui manquent dans la table public.livreurs.
-- =====================================================================

INSERT INTO public.livreurs (id, name, vehicle, phone, lat, lng, initial, contacts_count, subscription_paid, status, rating, city, cni_recto, cni_verso, selfie)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', 'Livreur'),
    COALESCE(raw_user_meta_data->>'vehicle', 'Moto'),
    COALESCE(raw_user_meta_data->>'phone', '+226 ' || substring(email from 1 for length(email) - 13)),
    COALESCE((raw_user_meta_data->>'lat')::numeric, 12.3714),
    COALESCE((raw_user_meta_data->>'lng')::numeric, -1.5197),
    COALESCE(raw_user_meta_data->>'initial', 'L'),
    0,
    COALESCE((raw_user_meta_data->>'subscription_paid')::boolean, false),
    COALESCE(raw_user_meta_data->>'status', 'en attente'),
    5.0,
    COALESCE(raw_user_meta_data->>'city', 'ouaga'),
    COALESCE(raw_user_meta_data->>'cni_recto', null),
    COALESCE(raw_user_meta_data->>'cni_verso', null),
    COALESCE(raw_user_meta_data->>'selfie', null)
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'rider'
  AND id NOT IN (SELECT id FROM public.livreurs)
ON CONFLICT (id) DO NOTHING;
