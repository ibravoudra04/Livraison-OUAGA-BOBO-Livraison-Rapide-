-- =====================================================================
--  Affiche le NOM du client (et pas "Client") dans la messagerie livreur
--  À EXÉCUTER UNE FOIS dans : Supabase → SQL Editor → New query → Run
-- ---------------------------------------------------------------------
--  Un livreur n'a (volontairement) pas le droit de lire la table des
--  clients. Cette fonction lui renvoie UNIQUEMENT l'id + le nom des
--  clients qui lui ont écrit — jamais le téléphone ni autre donnée.
--  Sans danger, ne modifie aucune donnée.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_my_chat_clients()
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT DISTINCT c.id, c.name
    FROM public.clients_livraison c
    JOIN public.chats_livraison ch ON ch.client_id = c.id
    WHERE ch.rider_id = auth.uid();
$$;

-- Seuls les utilisateurs connectés peuvent l'appeler (et la fonction ne
-- renvoie que LEURS propres conversations grâce à auth.uid()).
REVOKE EXECUTE ON FUNCTION public.get_my_chat_clients() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_chat_clients() TO authenticated;
