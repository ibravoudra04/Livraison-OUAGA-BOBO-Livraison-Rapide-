-- 1. Mise à jour de la vue `livreurs_view`
-- Puisque le paywall est maintenant global sur la carte, on n'a plus besoin du masquage individuel en base de données.
-- On renvoie directement le vrai numéro de téléphone sous `phone_display`.
CREATE OR REPLACE VIEW public.livreurs_view AS
SELECT 
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial, l.contacts_count, l.subscription_paid, l.status, l.views_count, l.rating, l.city, l.created_at, l.selfie, l.is_verified,
    l.phone as phone_display,
    true as is_unlocked
FROM public.livreurs l;

-- 2. Mise à jour de la politique des Avis (Reviews)
-- Avant, il fallait avoir un "déblocage" individuel pour noter un livreur.
-- Maintenant, comme le client doit payer le pass 200F ou 5000F pour voir la carte, tout client authentifié peut laisser un avis.
DROP POLICY IF EXISTS "Unlocked clients can post reviews" ON public.avis;
CREATE POLICY "Clients can post reviews" ON public.avis
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id
    );
