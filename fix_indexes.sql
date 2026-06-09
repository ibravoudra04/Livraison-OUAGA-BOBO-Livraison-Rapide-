-- =========================================================================
-- INDEX DE PERFORMANCE — DÉJÀ APPLIQUÉS DANS SUPABASE
-- Date : 2026-06-09
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_livreurs_city_status ON livreurs(city, status);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats_livraison(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deblocages_client ON deblocages(client_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut, created_at DESC);
