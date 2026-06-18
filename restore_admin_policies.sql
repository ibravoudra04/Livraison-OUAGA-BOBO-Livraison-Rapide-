-- Restore Admin Policies that were dropped
CREATE POLICY "Admins manage all livreurs" ON public.livreurs
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
    WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

CREATE POLICY "Admins manage all clients" ON public.clients_livraison
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
    WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

CREATE POLICY "Admins manage all unlocks" ON public.deblocages
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
    WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

CREATE POLICY "Admins can manage all chats" ON public.chats_livraison
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
    WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');
