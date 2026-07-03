-- Mise à jour de la vue pour rendre les numéros de téléphone toujours visibles et débloqués par défaut
CREATE OR REPLACE VIEW public.livreurs_view AS
SELECT 
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial, l.contacts_count, l.subscription_paid, l.status, l.views_count, l.rating, l.city, l.created_at, l.selfie, l.is_verified,
    l.phone as phone_display,
    true as is_unlocked
FROM public.livreurs l
CROSS JOIN (
    SELECT 
        auth.uid() as uid, 
        (auth.jwt()->'app_metadata'->>'role') as role
) ctx;

-- Mise à jour de la politique des avis pour permettre à tout utilisateur connecté de laisser un avis
DROP POLICY IF EXISTS "Unlocked clients can post reviews" ON public.avis;
CREATE POLICY "Unlocked clients can post reviews" ON public.avis
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id
    );
