-- =====================================================================
--  AJOUT DU STATUT « EN PAUSE » POUR LES LIVREURS
--  À EXÉCUTER UNE FOIS dans : Supabase → SQL Editor → New query → Run
-- ---------------------------------------------------------------------
--  Permet au livreur de se mettre "en pause" (invisible sur la carte)
--  sans être supprimé ni suspendu. SÛR À RELANCER, n'efface aucune donnée.
--
--  La colonne `status` a une contrainte qui n'autorise que certaines
--  valeurs. On l'élargit pour accepter aussi 'en pause'.
-- =====================================================================

ALTER TABLE public.livreurs DROP CONSTRAINT IF EXISTS livreurs_status_check;

ALTER TABLE public.livreurs ADD CONSTRAINT livreurs_status_check
    CHECK (status IN ('actif', 'en attente', 'suspendu', 'en pause', 'approved'));

-- Vérification : ne doit renvoyer aucune ligne en erreur
SELECT DISTINCT status FROM public.livreurs;
