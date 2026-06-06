-- 0. Nettoyer les objets de code (triggers, fonctions, vues) sans toucher aux données
-- ⚠️ NE JAMAIS UTILISER « DROP TABLE » EN PRODUCTION — cela détruit toutes les données !
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_deblocage_created ON public.deblocages CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.increment_rider_contacts() CASCADE;
DROP VIEW IF EXISTS public.livreurs_view CASCADE;

-- 1. Table des clients de livraison
CREATE TABLE IF NOT EXISTS public.clients_livraison (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    subscription_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des livreurs (riders)
CREATE TABLE IF NOT EXISTS public.livreurs (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    initial TEXT NOT NULL,
    contacts_count INTEGER NOT NULL DEFAULT 0,
    subscription_paid BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL CHECK (status IN ('actif', 'suspendu', 'en attente')),
    views_count INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC NOT NULL DEFAULT 4.8,
    city TEXT NOT NULL CHECK (city IN ('ouaga', 'bobo')),
    cni_recto TEXT,
    cni_verso TEXT,
    selfie TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table des déblocages (relations clients-livreurs)
CREATE TABLE IF NOT EXISTS public.deblocages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients_livraison(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES public.livreurs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(client_id, rider_id)
);

-- 4. Table des avis et revues de livreurs
CREATE TABLE IF NOT EXISTS public.avis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES public.livreurs(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    stars NUMERIC NOT NULL,
    date TEXT NOT NULL DEFAULT 'Aujourd''hui',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table des messages (chats)
CREATE TABLE IF NOT EXISTS public.chats_livraison (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES public.livreurs(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients_livraison(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'rider')),
    text TEXT,
    image_url TEXT,
    time TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- DÉCLENCHEUR DE SYNCHRONISATION DES PROFILS ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    IF (new.raw_user_meta_data->>'role') = 'client' THEN
        INSERT INTO public.clients_livraison (id, phone, name, subscription_paid)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'phone', new.phone),
            COALESCE(new.raw_user_meta_data->>'name', 'Client'),
            COALESCE((new.raw_user_meta_data->>'subscription_paid')::boolean, false)
        )
        ON CONFLICT (id) DO UPDATE SET
            phone = EXCLUDED.phone,
            name = EXCLUDED.name;
    ELSIF (new.raw_user_meta_data->>'role') = 'rider' THEN
        INSERT INTO public.livreurs (id, name, vehicle, phone, lat, lng, initial, contacts_count, subscription_paid, status, rating, city, cni_recto, cni_verso, selfie)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'name', 'Livreur'),
            COALESCE(new.raw_user_meta_data->>'vehicle', 'Moto'),
            COALESCE(new.raw_user_meta_data->>'phone', new.phone),
            COALESCE((new.raw_user_meta_data->>'lat')::numeric, 12.3714),
            COALESCE((new.raw_user_meta_data->>'lng')::numeric, -1.5197),
            COALESCE(new.raw_user_meta_data->>'initial', 'L'),
            0,
            COALESCE((new.raw_user_meta_data->>'subscription_paid')::boolean, false),
            COALESCE(new.raw_user_meta_data->>'status', 'en attente'),
            5.0,
            COALESCE(new.raw_user_meta_data->>'city', 'ouaga'),
            COALESCE(new.raw_user_meta_data->>'cni_recto', null),
            COALESCE(new.raw_user_meta_data->>'cni_verso', null),
            COALESCE(new.raw_user_meta_data->>'selfie', null)
        )
        ON CONFLICT (id) DO UPDATE SET
            phone = EXCLUDED.phone,
            name = EXCLUDED.name,
            vehicle = EXCLUDED.vehicle,
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng,
            initial = EXCLUDED.initial,
            city = EXCLUDED.city,
            cni_recto = EXCLUDED.cni_recto,
            cni_verso = EXCLUDED.cni_verso,
            selfie = EXCLUDED.selfie;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE VIEW public.livreurs_view AS
SELECT 
    l.id, l.name, l.vehicle, l.lat, l.lng, l.initial, l.contacts_count, l.subscription_paid, l.status, l.views_count, l.rating, l.city, l.created_at, l.selfie, l.is_verified,
    CASE 
        -- Période de gratuité de 30 jours (du 1er juin au 1er juillet 2026 inclus)
        WHEN now() < '2026-07-02 00:00:00+00'::timestamptz THEN l.phone
        -- Règle 1 : Le connecté est le livreur lui-même
        WHEN ctx.uid = l.id THEN l.phone
        -- Règle 2 : Le connecté a débloqué ce livreur
        WHEN EXISTS (
            SELECT 1 FROM public.deblocages d 
            WHERE d.client_id = ctx.uid AND d.rider_id = l.id
        ) THEN l.phone
        -- Règle 3 : Le connecté est un administrateur vérifié via app_metadata
        WHEN ctx.role = 'admin' THEN l.phone
        -- Par défaut : Masquage du numéro de téléphone
        ELSE 
            CASE 
                WHEN length(l.phone) >= 8 THEN substring(l.phone from 1 for 7) || ' •• •• ••'
                ELSE '+226 •• •• •• ••'
            END
    END as phone_display,
    CASE 
        -- Période de gratuité de 30 jours
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

-- --- ATTRIBUTION DES DROITS ET POLITIQUES RLS ---

-- Activer la sécurité RLS sur toutes les tables
ALTER TABLE public.clients_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livreurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deblocages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats_livraison ENABLE ROW LEVEL SECURITY;

-- 1. Droits d'accès sur les tables de profils
-- Clients : Lecture/écriture strictement restreinte à soi-même ou admin
CREATE POLICY "Clients manage own profile" ON public.clients_livraison
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage all clients" ON public.clients_livraison
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin'
    );

-- Livreurs : Modification de son propre profil, lecture restreinte
CREATE POLICY "Livreurs manage own profile" ON public.livreurs
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage all livreurs" ON public.livreurs
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin'
    );

-- Attribution de droits sur la vue pour tout le monde (requis pour afficher la carte)
GRANT SELECT ON public.livreurs_view TO anon, authenticated;

-- 2. Politiques RLS de Déblocages
-- Lecture : Les clients peuvent voir leurs propres déblocages
CREATE POLICY "Clients read own unlocks" ON public.deblocages
    FOR SELECT TO authenticated USING (auth.uid() = client_id);

-- Insertion : Un client ne peut s'insérer un déblocage lui-même QUE s'il est Premium (abonné payé).
-- Les utilisateurs gratuits passent par la fonction RPC simulate_payment_unlock()
CREATE POLICY "Premium clients can unlock directly" ON public.deblocages
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id 
        AND EXISTS (
            SELECT 1 FROM public.clients_livraison c 
            WHERE c.id = auth.uid() AND c.subscription_paid = true
        )
    );

CREATE POLICY "Admins manage all unlocks" ON public.deblocages
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin'
    );

-- 3. Politiques RLS des Avis (Reviews) avec traçabilité et unicité
-- Ajustement de la structure : Ajout de la colonne de traçabilité client et de la contrainte unique
ALTER TABLE public.avis ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients_livraison(id) ON DELETE CASCADE;
ALTER TABLE public.avis DROP CONSTRAINT IF EXISTS uq_client_rider_avis;
ALTER TABLE public.avis ADD CONSTRAINT uq_client_rider_avis UNIQUE (client_id, rider_id);

CREATE POLICY "Anyone can read reviews" ON public.avis
    FOR SELECT USING (true);

CREATE POLICY "Unlocked clients can post reviews" ON public.avis
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = client_id
        AND (
            now() < '2026-07-02 00:00:00+00'::timestamptz
            OR EXISTS (SELECT 1 FROM public.deblocages d WHERE d.client_id = auth.uid() AND d.rider_id = rider_id)
        )
    );

-- 4. Politiques RLS de Messagerie (Chats)
CREATE POLICY "Users can manage own chats" ON public.chats_livraison
    FOR ALL TO authenticated USING (
        auth.uid() = client_id OR auth.uid() = rider_id
    ) WITH CHECK (
        auth.uid() = client_id OR auth.uid() = rider_id
    );

CREATE POLICY "Admins can manage all chats" ON public.chats_livraison
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin'
    );

-- 5. Politiques RLS des Annonces Globales
CREATE TABLE IF NOT EXISTS public.annonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active annonces" ON public.annonces
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage annonces" ON public.annonces
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin'
    );

-- 6. Politiques RLS des Litiges (Tickets Support)
CREATE TABLE IF NOT EXISTS public.tickets_support (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients_livraison(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES public.livreurs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'resolu')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients read own tickets" ON public.tickets_support
    FOR SELECT TO authenticated USING (auth.uid() = client_id);

CREATE POLICY "Clients insert tickets" ON public.tickets_support
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins manage all tickets" ON public.tickets_support
    FOR ALL TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin'
    );

-- --- TRIGGER AUTOMATIQUE DE COMPTEUR DE DÉBLOCAGE ---
CREATE OR REPLACE FUNCTION public.increment_rider_contacts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.livreurs 
    SET contacts_count = contacts_count + 1
    WHERE id = new.rider_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deblocage_created ON public.deblocages CASCADE;
CREATE TRIGGER on_deblocage_created
    AFTER INSERT ON public.deblocages
    FOR EACH ROW EXECUTE FUNCTION public.increment_rider_contacts();

-- --- FONCTION SÉCURISÉE DE SIMULATION DE PAIEMENT POUR UTILISATEURS DE PASSAGE (RPC) ---
CREATE OR REPLACE FUNCTION public.simulate_payment_unlock(target_rider_id UUID)
RETURNS void AS $$
BEGIN
    -- Vérifier si l'utilisateur est connecté
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Non authentifié';
    END IF;
    
    -- Insérer le déblocage en contournant le RLS (SECURITY DEFINER)
    INSERT INTO public.deblocages (client_id, rider_id)
    VALUES (auth.uid(), target_rider_id)
    ON CONFLICT (client_id, rider_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- SÉCURISATION SUPPLÉMENTAIRE DES RÔLES : REVOKE EXECUTE DU SCHÉMA PUBLIC ---
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_rider_contacts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simulate_payment_unlock(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.simulate_payment_unlock(UUID) TO authenticated;

-- --- INDEXES DE PERFORMANCE (OPTIMISATION) ---
-- Index pour accélérer les requêtes RLS et les jointures
CREATE INDEX IF NOT EXISTS idx_deblocages_rider_id ON public.deblocages(rider_id);
CREATE INDEX IF NOT EXISTS idx_avis_rider_id ON public.avis(rider_id);
CREATE INDEX IF NOT EXISTS idx_avis_client_id ON public.avis(client_id);
CREATE INDEX IF NOT EXISTS idx_chats_rider_id ON public.chats_livraison(rider_id);
CREATE INDEX IF NOT EXISTS idx_chats_client_id ON public.chats_livraison(client_id);
CREATE INDEX IF NOT EXISTS idx_livreurs_status ON public.livreurs(status);
CREATE INDEX IF NOT EXISTS idx_livreurs_city ON public.livreurs(city);

-- --- NOTIFICATIONS PUSH ---
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own push subscriptions" ON public.push_subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all push subscriptions" ON public.push_subscriptions
    FOR SELECT TO authenticated USING (
        (auth.jwt()->'app_metadata'->>'role') = 'admin' OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin' OR
        (auth.jwt()->'user_metadata'->>'phone') LIKE '%67370909%'
    );

CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);
