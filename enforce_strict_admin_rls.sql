-- Restore strict security by removing user_metadata.role bypass
DROP POLICY IF EXISTS "Admins manage all livreurs" ON public.livreurs;
DROP POLICY IF EXISTS "Admins manage all clients" ON public.clients_livraison;
DROP POLICY IF EXISTS "Admins manage all unlocks" ON public.deblocages;
DROP POLICY IF EXISTS "Admins can manage all chats" ON public.chats_livraison;

-- We already have the secure policies from CORRECTIF_SECURITE_URGENT.sql:
-- e.g. "livreur_admin", "client_admin", "deblocage_admin", "chat_admin"
-- We just need to make sure they exist and only use app_metadata.role

CREATE OR REPLACE VIEW public.livreurs_view AS
SELECT 
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial, l.contacts_count, l.subscription_paid, l.status, l.views_count, l.rating, l.city, l.created_at, l.selfie, l.cni_recto, l.cni_verso, l.is_verified,
    CASE 
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN l.phone
        WHEN ctx.uid = l.id THEN l.phone
        WHEN EXISTS (
            SELECT 1 FROM public.deblocages d 
            WHERE d.client_id = ctx.uid AND d.rider_id = l.id
        ) THEN l.phone
        WHEN ctx.role = 'admin' THEN l.phone
        ELSE 
            CASE 
                WHEN length(l.phone) >= 8 THEN substring(l.phone from 1 for 7) || ' •• •• ••'
                ELSE '+226 •• •• •• ••'
            END
    END as phone_display,
    CASE 
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN true
        WHEN ctx.uid = l.id 
           OR EXISTS (
               SELECT 1 FROM public.deblocages d 
               WHERE d.client_id = ctx.uid AND d.rider_id = l.id
           ) 
           OR ctx.role = 'admin' THEN true
        ELSE false
    END as is_unlocked
FROM public.livreurs l
CROSS JOIN (
    SELECT 
        auth.uid() as uid, 
        (auth.jwt()->'app_metadata'->>'role') as role
) ctx;

GRANT SELECT ON public.livreurs_view TO anon, authenticated;
