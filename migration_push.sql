-- =========================================================================
-- MIGRATION SQL : SYSTÈME DE NOTIFICATIONS PUSH
-- =========================================================================

-- 1. Table des Abonnements Push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Sécurité RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can read own push subscriptions" ON public.push_subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admins can read all push subscriptions" ON public.push_subscriptions
    FOR SELECT TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

-- 3. Index de performance
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);
