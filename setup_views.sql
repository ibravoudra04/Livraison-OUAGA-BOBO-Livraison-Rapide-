-- Migration SQL : Compteur de vues pour les livreurs
CREATE OR REPLACE FUNCTION public.increment_livreur_views(target_rider_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.livreurs 
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = target_rider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions d'exécution aux utilisateurs anonymes et connectés
GRANT EXECUTE ON FUNCTION public.increment_livreur_views(UUID) TO anon, authenticated;
