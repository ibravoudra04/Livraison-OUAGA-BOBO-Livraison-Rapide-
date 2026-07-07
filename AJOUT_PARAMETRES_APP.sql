-- =====================================================================
--  PARAMÈTRES MODIFIABLES DEPUIS LA DASHBOARD ADMIN
--  À EXÉCUTER UNE FOIS dans : Supabase → SQL Editor → New query → Run
-- ---------------------------------------------------------------------
--  Crée une petite table de réglages (numéro WhatsApp du support, téléphone,
--  texte d'accueil...) que l'admin peut modifier depuis la dashboard,
--  sans toucher au code. SÛR À RELANCER, n'efface aucune donnée.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.parametres_app (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parametres_app ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut LIRE les réglages (l'app en a besoin pour s'afficher)
DROP POLICY IF EXISTS "parametres_read_all" ON public.parametres_app;
CREATE POLICY "parametres_read_all" ON public.parametres_app
    FOR SELECT USING (true);

-- Seul l'ADMIN (rôle serveur) peut les modifier
DROP POLICY IF EXISTS "parametres_admin_write" ON public.parametres_app;
CREATE POLICY "parametres_admin_write" ON public.parametres_app
    FOR ALL TO authenticated
    USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
    WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Valeurs de départ (identiques à ce qui est codé en dur aujourd'hui)
INSERT INTO public.parametres_app (key, value) VALUES
    ('support_whatsapp', '22667370909'),
    ('support_phone', '+22667370909'),
    ('welcome_text', 'Visualisez les livreurs actifs autour de vous sur la carte en temps réel et contactez-les en un clic.')
ON CONFLICT (key) DO NOTHING;

-- Vérification : doit afficher les 3 lignes
SELECT * FROM public.parametres_app;
