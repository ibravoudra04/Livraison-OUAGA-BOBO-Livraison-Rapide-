# 🗺️ FEUILLE DE ROUTE D'AMÉLIORATION — Livraison Rapide
*Phase 4 de l'audit — 18 juin 2026. Propositions concrètes après analyse du concept, du code, de la base Supabase et de la navigation réelle. Rien n'a été modifié : ce document attend votre accord.*

---

## Comment lire ce document
Chaque proposition indique :
- **Le problème** (en français simple)
- **La solution**
- **Le bénéfice attendu**
- **Impact** : 🟢 Fort / 🟡 Moyen / ⚪ Faible
- **Difficulté** : 🟢 Facile / 🟡 Moyenne / 🔴 Difficile

À la fin, un **tableau de priorités** classe tout dans l'ordre : *à faire en premier → ensuite → plus tard*. On commence toujours par ce qui a un fort impact ET qui est facile.

> ⚠️ Rappel du concept de votre app : ce n'est **pas** une app de commande de repas classique. C'est un **annuaire de livreurs géolocalisés**. Le client paie 500 FCFA pour débloquer la carte, voit les livreurs autour de lui, et **contacte directement le livreur** (appel / chat) pour négocier sa course. Il n'y a donc pas de "panier" ni de "commande" formelle : c'est une mise en relation. Plusieurs de mes propositions partent de ce constat.

---

## 1. LOGIQUE GÉNÉRALE DE L'APP

### 1.1 — Le parcours actuel manque d'une "trace de la mise en relation" 🟢 Fort / 🟡 Moyenne
**Problème :** Aujourd'hui, quand un client débloque puis appelle un livreur, il ne reste presque rien : pas de "course" enregistrée, pas de statut (en cours / terminée / annulée). Le client comme le livreur ne savent pas retrouver facilement "avec qui j'ai été en contact hier". La table `deblocages` enregistre bien le déblocage, mais elle n'est pas exploitée comme un historique lisible des deux côtés.
**Solution :** Transformer chaque déblocage en une petite "fiche de mise en relation" visible des deux côtés (client et livreur) avec : date, nom de l'autre personne, bouton "rappeler", bouton "rouvrir le chat", et bouton "laisser un avis" (une fois le système d'avis réparé). Pas besoin d'un système de commande complexe.
**Bénéfice :** Le client retrouve ses livreurs habituels en un clic (fidélisation), le livreur voit son activité, et on augmente naturellement le nombre d'avis.

### 1.2 — Aucune gestion de l'annulation / livreur injoignable ⚪ Faible / 🟢 Facile
**Problème :** Si le client paie 500 FCFA, débloque un livreur, mais que celui-ci ne répond pas, le client a "payé pour rien" et n'a aucun recours visible.
**Solution :** Après un déblocage, proposer un petit bouton "Ce livreur ne répond pas → en voir un autre" qui rouvre la carte sans refaire payer (dans une fenêtre de quelques minutes). À cadrer avec votre modèle économique.
**Bénéfice :** Évite la frustration et les litiges, rassure le client sur le fait qu'il en a "pour son argent".

### 1.3 — Statut "disponible / occupé" du livreur pas clair pour le client 🟡 Moyen / 🟡 Moyenne
**Problème :** La carte affiche les livreurs "actifs", mais un livreur "actif" peut déjà être en pleine course. Le client peut appeler quelqu'un d'indisponible.
**Solution :** Ajouter un interrupteur simple côté livreur : **Disponible / Occupé**. Les livreurs "occupés" apparaissent en gris (ou disparaissent) sur la carte.
**Bénéfice :** Moins d'appels dans le vide, meilleure expérience des deux côtés.

---

## 2. PROFIL LIVREUR

### 2.1 — "Gains du jour" et compteur de contacts mis en avant 🟢 Fort / 🟡 Moyenne
**Problème :** Le tableau de bord livreur montre des stats, mais pas l'information qui motive le plus un livreur : *combien de clients m'ont contacté aujourd'hui / cette semaine*. Les colonnes `contacts_count` et `views_count` existent déjà en base mais ne sont pas mises en valeur.
**Solution :** En haut du tableau de bord livreur, 3 gros chiffres : **Contacts aujourd'hui**, **Vues de ma fiche**, **Note moyenne**. Optionnellement un mini-historique des 7 derniers jours.
**Bénéfice :** Le livreur voit l'app comme un outil rentable → il reste actif et paie son abonnement.

### 2.2 — Interrupteur "Disponible / Occupé" bien visible 🟡 Moyen / 🟡 Moyenne
*(Voir 1.3 — c'est l'action côté livreur de cette amélioration.)* Un seul gros bouton vert/orange en haut de son écran.

### 2.3 — Le bouton "Régler mon abonnement (500 FCFA)" ne fait rien (bug M4) 🟡 Moyen / 🟢 Facile
**Problème :** Le bouton existe mais n'a aucune action. Le livreur ne peut pas payer son abonnement depuis l'app.
**Solution :** Soit le brancher sur le même flux de paiement (capture + vérification IA) que le client, soit le masquer tant que le flux n'est pas prêt, pour ne pas tromper le livreur.
**Bénéfice :** Permet d'encaisser réellement les abonnements livreurs (votre future source de revenus principale).

### 2.4 — Le client apparaît comme "Client" générique (bug M2) ⚪ Faible / 🟡 Moyenne
**Problème :** Dans le chat, le livreur voit "Client" au lieu du prénom, parce que les règles de sécurité (RLS) empêchent — à juste titre — le livreur de lire toute la fiche client.
**Solution :** Faire remonter **uniquement le prénom** du client de façon contrôlée (par exemple via le message de chat lui-même ou une mini-vue sécurisée qui n'expose que le prénom). On n'ouvre pas l'accès à toute la fiche.
**Bénéfice :** Échange plus humain et plus clair, sans casser la confidentialité.

### 2.5 — Écran livreur pensé "en déplacement" 🟡 Moyen / 🟡 Moyenne
**Problème :** Le livreur consulte son téléphone d'une main, souvent en mouvement.
**Solution :** Gros boutons, informations essentielles en premier (statut + nouveaux messages + contacts du jour), le reste plus bas. Notifications sonores/vibrations claires à la réception d'un message.
**Bénéfice :** Utilisable en une seconde, même en conduisant à l'arrêt.

---

## 3. PROFIL CLIENT

### 3.1 — Réparer puis enrichir le système d'avis 🟢 Fort / 🟢 Facile
**Problème :** *(Déjà corrigé en Phase 3 : la fenêtre d'avis s'ouvre et enregistre dans `stars`.)* Il reste à **inciter** à laisser un avis.
**Solution :** Après un déblocage/contact, proposer automatiquement "Comment s'est passée votre course avec [livreur] ?" (voir 1.1).
**Bénéfice :** Plus d'avis = plus de confiance pour les nouveaux clients = plus de déblocages payants.

### 3.2 — "Mes livreurs récents" / favoris 🟢 Fort / 🟡 Moyenne
**Problème :** Le client qui a trouvé un bon livreur doit recommencer toute la recherche (et potentiellement re-payer) la prochaine fois.
**Solution :** Une section "Mes livreurs récents" (basée sur `deblocages`) + possibilité de mettre un livreur en favori et de le recontacter directement.
**Bénéfice :** Fidélisation, gain de temps, le client revient dans l'app.

### 3.3 — Réduire le nombre de clics pour débloquer 🟡 Moyen / 🟡 Moyenne
**Problème :** Le parcours paiement (capture d'écran Orange Money → lecture par l'IA) demande plusieurs étapes manuelles.
**Solution court terme :** Simplifier l'écran (instructions visuelles étape par étape, exemple de capture), garder le résultat en mémoire pour ne pas redemander pendant la session.
**Solution long terme :** Intégration directe Orange Money / Moov Money (API marchand) pour valider le paiement automatiquement, sans capture.
**Bénéfice :** Moins d'abandons au moment de payer.

### 3.4 — Temps estimé / distance du livreur ⚪ Faible / 🟡 Moyenne
**Problème :** Le client voit les livreurs sur la carte mais pas "à quelle distance" ni "dans combien de temps".
**Solution :** Afficher la distance approximative (calcul simple à vol d'oiseau, gratuit) sur chaque fiche livreur.
**Bénéfice :** Le client choisit le plus proche en confiance.

---

## 4. FLUIDITÉ & PERFORMANCE SUR TÉLÉPHONES PEU PUISSANTS  ⚠️ PRIORITÉ HAUTE

> Bonne nouvelle : beaucoup de bonnes pratiques sont **déjà en place** — la carte ne dessine que les livreurs visibles à l'écran (rendu "virtuel"), les photos d'inscription sont compressées avant envoi, la carte se charge à part (chargement différé), et les timeouts réseau ont été ajoutés à l'inscription livreur. Voici ce qui reste à améliorer.

### 4.1 — La carte télécharge trop de données (et expose des données privées) 🟢 Fort / 🟢 Facile
**Problème :** Pour afficher la carte, l'app demande **toutes les colonnes** des livreurs (`select('*')` sur `livreurs_view`). Or cette vue contient aussi les **URLs des pièces d'identité (CNI recto/verso)** et d'autres champs inutiles à la carte. Résultat : (1) on télécharge plus de données que nécessaire sur des connexions lentes, et (2) **les liens vers les CNI sont envoyés au navigateur de chaque visiteur** — c'est un problème de confidentialité.
**Solution :** Ne demander que les colonnes utiles à la carte : `id, name, first_name, lat, lng, selfie, rating, city, status, vehicle` (et le téléphone seulement quand il est débloqué). Ne **jamais** envoyer `cni_recto` / `cni_verso` au client.
**Bénéfice :** Carte plus rapide à charger, moins de données mobiles consommées, et fuite de pièces d'identité fermée. **À traiter en priorité.**

### 4.2 — Les photos des livreurs ne sont pas redimensionnées pour l'affichage 🟢 Fort / 🟡 Moyenne
**Problème :** Sur la carte, chaque livreur est un petit rond de 36 pixels, mais l'app charge la photo en taille réelle (~150–300 Ko chacune). Avec 30+ livreurs, ça fait plusieurs Mo de photos pour des miniatures minuscules. Idem dans les listes.
**Solution :** Utiliser la **transformation d'image de Supabase** (ajouter `?width=80&quality=60` à l'URL) pour servir une miniature légère, ou générer une vignette à l'upload. Et activer le **chargement progressif** (l'image se charge quand elle apparaît à l'écran).
**Bénéfice :** Premier affichage de la carte beaucoup plus rapide, surtout en 3G. Gros gain sur téléphones d'entrée de gamme.

### 4.3 — Gestion des coupures réseau et messages d'erreur clairs 🟢 Fort / 🟡 Moyenne
**Problème :** Sur réseau instable (2G/3G qui saute), si une action échoue (charger la carte, envoyer un message), l'utilisateur peut rester sans explication. Les timeouts existent pour l'inscription livreur, mais pas partout.
**Solution :** (1) Bandeau "Pas de connexion — nouvelle tentative…" quand le réseau est coupé ; (2) bouton "Réessayer" sur les écrans qui n'ont pas pu charger ; (3) re-tentative automatique simple pour le chargement de la carte ; (4) le chat conserve déjà le message à l'écran ("optimiste") — afficher clairement "non envoyé, appuyez pour réessayer" en cas d'échec.
**Bénéfice :** L'app reste utilisable et compréhensible même quand le réseau est mauvais — c'est le quotidien de vos utilisateurs.

### 4.4 — Accélérer le tout premier chargement ⚪ Faible / 🟡 Moyenne
**Problème :** Au démarrage, l'app charge le portail d'accueil, la carte, les annonces, etc. Sur un téléphone lent, le premier affichage peut tarder.
**Solution :** Charger d'abord le strict minimum (le portail de choix de ville), puis charger la carte et les annonces en arrière-plan. Vérifier que le service worker (déjà présent) met bien en cache les fichiers de l'app pour les visites suivantes.
**Bénéfice :** L'app "apparaît" plus vite, l'utilisateur n'a pas l'impression qu'elle est bloquée.

---

## 5. SCALABILITÉ (quand l'app aura beaucoup d'utilisateurs)

> Aujourd'hui (≈40 comptes, 31 livreurs), tout va vite. Ces points deviennent importants quand vous passerez à des milliers d'utilisateurs et de messages.

### 5.1 — Index manquant sur le chat (la requête la plus fréquente) 🟢 Fort / 🟢 Facile
**Problème :** Ouvrir une conversation cherche les messages "de ce livreur AVEC ce client, triés par date". Il existe un index sur `rider_id` seul et un sur `client_id` seul, mais **pas d'index combiné** sur les trois (`rider_id`, `client_id`, `created_at`). Avec des dizaines de milliers de messages, l'ouverture du chat ralentira.
**Solution :** Ajouter un index combiné `(rider_id, client_id, created_at)` sur la table `chats_livraison`.
**Bénéfice :** Le chat reste instantané même avec un gros volume de messages. Facile et sans risque.

### 5.2 — Les listes admin chargent TOUT d'un coup (pas de pagination) 🟡 Moyen / 🟡 Moyenne
**Problème :** Le tableau de bord admin demande **tous** les livreurs, **tous** les paiements et **toutes** les annonces en une fois (`select('*')` sans limite). À 10 000 paiements, l'écran admin deviendra lent et lourd.
**Solution :** Charger par petits paquets (pagination : 20–50 lignes à la fois, avec "Voir plus"), et ne demander que les colonnes affichées.
**Bénéfice :** Le back-office reste rapide quand l'activité grandit.

### 5.3 — Nettoyage automatique des abonnements de notification 🟡 Moyen / 🟡 Moyenne
**Problème :** Il y a ~300+ abonnements push, dont beaucoup périmés. À chaque envoi groupé, on essaie d'écrire à des appareils qui n'existent plus → envois plus lents et inutiles. (L'endpoint broadcast nettoie déjà les 404/410, c'est un bon début.)
**Solution :** Tâche de nettoyage régulière qui supprime les abonnements expirés, + éviter les doublons par utilisateur/appareil.
**Bénéfice :** Notifications plus rapides et plus fiables à grande échelle.

### 5.4 — Index sur les recherches à venir ⚪ Faible / 🟢 Facile
**Problème :** Les recherches admin par nom/téléphone et les futurs historiques client (`deblocages` par client trié par date) n'ont pas tous d'index dédiés.
**Solution :** Ajouter au besoin un index `(client_id, created_at)` sur `deblocages` (pour "mes courses récentes") quand la fonctionnalité 3.2 sera développée.
**Bénéfice :** Anticipe les ralentissements, peu de travail.

---

## 📊 TABLEAU DE PRIORITÉS (ordre conseillé)

### ① À FAIRE EN PREMIER — fort impact + facile
| # | Amélioration | Impact | Difficulté |
|---|---|---|---|
| 4.1 | Carte : ne charger que les colonnes utiles + **ne plus exposer les CNI** | 🟢 Fort | 🟢 Facile |
| 5.1 | Index combiné sur le chat | 🟢 Fort | 🟢 Facile |
| 3.1 | Inciter à laisser un avis après un contact | 🟢 Fort | 🟢 Facile |
| 2.3 | Brancher (ou masquer) le bouton abonnement livreur | 🟡 Moyen | 🟢 Facile |

### ② ENSUITE — fort impact, un peu plus de travail
| # | Amélioration | Impact | Difficulté |
|---|---|---|---|
| 4.2 | Miniatures de photos + chargement progressif | 🟢 Fort | 🟡 Moyenne |
| 4.3 | Gestion des coupures réseau + messages clairs | 🟢 Fort | 🟡 Moyenne |
| 2.1 | Tableau de bord livreur "Contacts du jour / Vues / Note" | 🟢 Fort | 🟡 Moyenne |
| 3.2 | "Mes livreurs récents" / favoris côté client | 🟢 Fort | 🟡 Moyenne |
| 1.1 | Fiche "mise en relation" (historique des deux côtés) | 🟢 Fort | 🟡 Moyenne |

### ③ PLUS TARD — utile, à planifier
| # | Amélioration | Impact | Difficulté |
|---|---|---|---|
| 1.3 / 2.2 | Statut Disponible / Occupé du livreur | 🟡 Moyen | 🟡 Moyenne |
| 5.2 | Pagination des listes admin | 🟡 Moyen | 🟡 Moyenne |
| 5.3 | Nettoyage automatique des abonnements push | 🟡 Moyen | 🟡 Moyenne |
| 3.3 | Simplifier le paiement (puis API Orange/Moov Money) | 🟡 Moyen | 🟡→🔴 |
| 2.4 | Afficher le prénom du client au livreur | ⚪ Faible | 🟡 Moyenne |
| 3.4 | Distance/temps estimé du livreur | ⚪ Faible | 🟡 Moyenne |
| 4.4 | Accélérer le premier chargement | ⚪ Faible | 🟡 Moyenne |
| 1.2 | Recours "livreur injoignable" | ⚪ Faible | 🟢 Facile |
| 5.4 | Index `deblocages (client_id, created_at)` | ⚪ Faible | 🟢 Facile |

---

## ⏸ ACTIONS EN ATTENTE DE VALIDATION
Conformément à vos consignes, **je n'ai modifié aucun code et aucune donnée**. Voici ce que je peux faire dès votre accord (du plus prioritaire au moins) :

1. **Sécuriser + alléger la carte (4.1)** — modifier la requête de la carte pour ne charger que les colonnes utiles et **arrêter d'envoyer les liens CNI** aux visiteurs. *(Modification de code uniquement, sans risque pour les données.)*
2. **Ajouter l'index chat (5.1)** — un script SQL `CREATE INDEX (rider_id, client_id, created_at)` à exécuter dans Supabase. *(Sans risque, n'efface rien.)*
3. **Inciter aux avis (3.1)** + **bouton abonnement livreur (2.3)** — petites modifications de code.
4. Le reste de la feuille de route, dans l'ordre du tableau, à votre rythme.

> Dites-moi simplement **par quel(s) numéro(s) commencer** et je m'en occupe. Je peux aussi tout faire dans l'ordre ① → ② → ③.

---

## ❓ QUESTIONS POUR VOUS
1. **Statut Disponible/Occupé (1.3)** : voulez-vous que les livreurs "occupés" *disparaissent* de la carte, ou qu'ils restent affichés *en gris* ?
2. **Recours "livreur injoignable" (1.2)** : si un livreur ne répond pas, acceptez-vous d'offrir un second déblocage gratuit dans la foulée, ou non (pour protéger vos revenus) ?
3. **Paiement (3.3)** : avez-vous accès à une **API marchand Orange Money / Moov Money** ? Cela conditionne l'automatisation du paiement (sinon on garde la capture + IA).
4. **Abonnement livreur (2.3)** : quel est le **prix et la fréquence** exacts de l'abonnement livreur (500 FCFA par… jour ? semaine ? mois ?) pour brancher le bon flux ?

---
*Document généré le 18 juin 2026. En attente de votre accord avant toute modification de code ou de base de données.*
