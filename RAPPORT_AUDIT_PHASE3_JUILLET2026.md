# RAPPORT D'AUDIT — PHASE 3 (BILAN) — Livraison Rapide
### 7 juillet 2026

> Tests réels menés sur une copie locale **identique** à la production (version `2026-07-07_v8`), branchée sur la **vraie base Supabase**. 34 tests automatisés au total : parcours utilisateur (navigateur), chemins de sécurité RLS réels, et chat temps réel. Tous les comptes/données de test ont été **supprimés** (vérifié : 0 résiduel, retour à 62 comptes comme au début). Scripts : `scratch/audit2_phase2_backend.mjs`, `audit2_phase2_ui.mjs`, `audit2_realtime_v2.mjs`. Captures : `scratch/audit2_screens/`.

---

## 1. ÉTAT GÉNÉRAL (verdict en 3 lignes)

**L'app est prête pour de vrais clients.** Le cœur du service fonctionne de bout en bout : un client s'inscrit, voit les livreurs sur la carte, les appelle, discute en temps réel, laisse un avis et signale un problème ; l'admin gère tout depuis son tableau de bord. La sécurité est solide (isolation des données confirmée, faux admin bloqué).
Il reste surtout du **ménage** à faire (comptes de test oubliés, sections d'affichage factices, stockage des pièces d'identité en public) — rien qui empêche l'utilisation, mais à traiter avant une grosse campagne de pub.

---

## 2. TABLEAU DES TESTS

| # | Fonctionnalité | Profil | Résultat | Commentaire |
|---|---|---|---|---|
| A1-A3 | Carte, choix ville/quartier, "livreur le plus proche" | Visiteur | ✅ | 43 livreurs affichés, 76 quartiers Ouaga / 80 Bobo |
| A4 | Téléphone affiché + bouton Appeler | Visiteur | ✅ | Numéro en clair (site gratuit) |
| A5 | Lecture des avis d'un livreur | Visiteur | ✅ | Fenêtre "Notes & Avis" |
| A6 | Chat bloqué sans compte | Visiteur | ✅ | Invite à se connecter |
| A7 | Pages confidentialité + suppression compte | Visiteur | ✅ | Accessibles |
| B1 | Inscription client (formulaire réel) | Client | ✅ | Compte + profil créés, rôle = client |
| B2 | Cas d'erreur (mauvais PIN, n° inexistant, doublon) | Client | ✅ | Tous refusés correctement |
| B3 | Connexion / déconnexion | Client | ✅ | |
| **B4** | **Donner un avis (étoiles + texte)** | Client | ✅ | **Fonctionne — inquiétude Phase 1 levée** |
| B4-UI | Soumission d'avis via l'interface | Client | ✅ | Enregistré + "Merci pour votre avis" |
| B5 | Envoi message chat + relecture | Client | ✅ | |
| B6 | Tableau de bord client | Client | ✅ | S'affiche après connexion |
| B7 | Signalement (chemin technique) | Client | ✅ | Fonctionne MAIS aucun bouton pour l'ouvrir (voir 🟠) |
| C1 | Inscription livreur + profil | Livreur | ✅ | Statut initial "en attente" |
| C2 | Livreur "en attente" invisible sur la carte | Livreur | ✅ | Confirmé |
| C5 | Réponse livreur → client | Livreur | ✅ | |
| Chat | Livraison **temps réel** (2 sessions) | Client↔Livreur | ✅ | Message reçu en **212 ms** sans rafraîchir |
| D1 | Connexion admin | Admin | ✅ | (compte admin de test) |
| D2 | Valider une candidature | Admin | ✅ | Le livreur apparaît sur la carte |
| D3 | Badge vérifié (donner/retirer) | Admin | ✅ | |
| D4 | Suspendre → invisible carte | Admin | ✅ | |
| D5 | Litiges : voir / résoudre / rouvrir / supprimer | Admin | ✅ | Avec noms client + livreur |
| D6 | Avis : voir / supprimer | Admin | ✅ | |
| D7 | Annonce : publier / voir / désactiver | Admin | ✅ | Bandeau in-app |
| D8 | API push refuse un non-admin | Admin | ✅ | HTTP 401 |
| D9 | Export CSV (lecture complète) | Admin | ✅ | 45 livreurs, 8 clients lus |
| E1 | Isolation chat entre 2 clients | Sécurité | ✅ | Client B ne voit pas les messages de A |
| E2 | Modification croisée livreur interdite | Sécurité | ✅ | Un client ne peut pas éditer un livreur |
| E3 | Accès anonyme aux tables sensibles | Sécurité | ✅ | Tout bloqué |
| E4 | Faux admin (rôle trafiqué) | Sécurité | ✅ | Aucun accès |
| — | Suppression de compte (endpoint) | Client | ✅ | Refuse l'anonyme ; suppression en cascade vérifiée |

**Score : 34 / 34 tests réussis.**

---

## 3. BUGS CLASSÉS PAR GRAVITÉ

### 🔴 Bloquant
*Aucun.* (L'inquiétude n°1 de la Phase 1 — avis bloqués — a été **testée et infirmée** : les avis fonctionnent. La table est vide simplement parce qu'aucun vrai client n'en a encore laissé.)

### 🟠 Gênant
1. **Le bouton "Signaler un problème" n'existe plus dans l'interface.** Le formulaire, la base et le tableau de bord admin fonctionnent parfaitement (testés), mais depuis le retrait des boutons du volet livreur, **plus rien ne permet à un client d'ouvrir le signalement**. C'est une fonctionnalité complète mais inaccessible.
2. **Les pièces d'identité des livreurs (CNI + selfies) sont dans un stockage PUBLIC.** Le bucket `identities` est public : quiconque possède le lien d'un fichier peut voir une CNI **sans être connecté**. Les liens sont difficiles à deviner, mais des données personnelles sensibles ne devraient jamais être dans un espace public. (Idem `recus-paiements`, héritage.)
3. **La section "Notes & Avis" du tableau de bord livreur est factice.** Elle affiche toujours "5.0 / Basé sur 0 avis / Aucun avis reçu", jamais branchée à la vraie base. Un livreur ne voit donc jamais les avis qu'il reçoit.
4. **3 livreurs "actif" sans aucun document** (parfait ouattara, Compaore Malgrenoma, Olivier Nikiema) sont visibles sur la carte sans selfie ni CNI — impossible de les vérifier.
5. **Compteurs d'avis non rafraîchis en direct.** Après avoir laissé un avis, la fenêtre affiche encore "Basé sur 0 avis / 5.0" alors que le nouvel avis apparaît juste en dessous. La moyenne et le nombre ne se recalculent qu'au prochain chargement.

### 🟡 Mineur
6. **10 comptes livreur "fantômes"** (compte créé, profil jamais enregistré), dont **5 comptes de test oubliés en prod depuis juin** (ghost7402, ghost52631, testbug14327, testupload7002, test27114).
7. **Le statut "En ligne" du chat est décoratif** (toujours vert, même si l'autre personne est partie).
8. **5 paiements orphelins** dans la table `paiements` (clients supprimés) + tables `paiements`/`deblocages` et le code `usePaymentSimulation` : vestiges de l'ère payante, désormais inutiles.
9. **PIN court peu robuste** : un PIN de 4 chiffres complété par un suffixe fixe connu = 10 000 combinaisons. Acceptable pour ce service, mais à savoir.
10. **Kaspersky bloque le domaine** livraisonrapide.app ("site susceptible de provoquer une fuite de données") — certains visiteurs verront un écran d'alerte. À signaler à Kaspersky comme faux positif.
11. **3 comptes admin** coexistent (admin@, 67370909@, 22667370909@livraison.com) ; un seul suffirait.
12. **Déséquilibre géographique** : 43 livreurs à Ouaga, 1 seul à Bobo.

---

## 4. PROBLÈMES DE BASE DE DONNÉES

| Sujet | Constat | Gravité |
|---|---|---|
| Sécurité RLS | ✅ Excellente : anonyme bloqué partout, faux admin bloqué, isolation client/livreur confirmée, vue publique sans CNI | OK |
| Stockage public | 🟠 Buckets `identities` (CNI/selfies) et `recus-paiements` en accès public | Gênant |
| Comptes fantômes | 🟡 10 comptes auth "rider" sans profil livreur (dont 5 de test) | Mineur |
| Données orphelines | 🟡 5 paiements liés à des clients supprimés | Mineur |
| Tables mortes | 🟡 `paiements` et `deblocages` ne servent plus (passage au gratuit) | Mineur |
| Liens (clés étrangères) | ✅ Cohérents : chats/avis/tickets bien reliés aux clients et livreurs | OK |
| Documents manquants | 🟠 3 livreurs actifs sans selfie ni CNI | Gênant |

---

## 5. PLAN DE CORRECTION (ordonné)

> ⏸ **Rien ne sera corrigé sans ton accord.** Voici l'ordre conseillé, du plus utile au moins urgent.

**Étape 1 — Remettre le bouton "Signaler un problème"** (🟠 #1)
Le formulaire existe déjà et marche. Il suffit de rajouter un petit bouton discret dans le volet du livreur pour l'ouvrir. *Simple, rapide, redonne accès à une fonctionnalité déjà construite.*

**Étape 2 — Sécuriser les pièces d'identité** (🟠 #2)
Rendre le bucket `identities` privé et faire en sorte que seul l'admin puisse voir les CNI/selfies (via des liens temporaires signés). *Protège les données personnelles de tes livreurs — important vis-à-vis de la loi et de la confiance.*

**Étape 3 — Brancher les vrais avis du livreur** (🟠 #3) et **rafraîchir les compteurs** (🟠 #5)
Afficher les vrais avis reçus dans le tableau de bord livreur, et recalculer la moyenne/le nombre après un nouvel avis. *Rend l'app honnête et motive les livreurs.*

**Étape 4 — Ménage en base** (🟡 #6, #8)
Supprimer les 5 comptes de test oubliés, les comptes fantômes et les paiements orphelins. *Base plus propre, statistiques plus justes.* (Action destructive → je te listerai exactement quoi avant de supprimer.)

**Étape 5 — Politique documents livreurs** (🟠 #4)
Décider : soit exiger les documents avant validation, soit demander aux 3 livreurs concernés de les fournir. *Choix métier de ta part.*

**Étape 6 — Nettoyage du code mort** (🟡 #7, #8)
Retirer la simulation de paiement, le statut "en ligne" trompeur, les tables inutilisées. *Code plus léger, moins de bugs futurs.*

**Étape 7 — Déclarer le faux positif à Kaspersky** (🟡 #10) *Hors code — démarche à faire sur le site de Kaspersky.*

---

## 6. SUGGESTIONS D'AMÉLIORATION (3 à 5 idées)

1. **Recruter des livreurs à Bobo-Dioulasso.** 1 seul livreur vs 43 à Ouaga : la ville est quasi vide côté service. Une petite campagne ciblée équilibrerait l'offre.
2. **Filtrer les livreurs par moyen de transport** (moto / tricycle / voiture) sur la carte. Un client qui a un gros colis cherchera un tricycle ou une voiture.
3. **Indiquer un vrai statut de présence** : "vu il y a X minutes" à la place du "En ligne" toujours vert, basé sur la dernière mise à jour GPS du livreur. Plus honnête et plus utile.
4. **Notification à l'admin pour chaque nouveau signalement** (push ou e-mail) pour ne pas avoir à surveiller le tableau de bord en permanence.
5. **Encourager les avis après un contact** : proposer au client de noter le livreur quelque temps après l'avoir appelé/contacté — cela remplira la note des livreurs (aujourd'hui 0 avis en base) et renforcera la confiance des nouveaux clients.

---
*Fin du rapport Phase 3 — 7 juillet 2026. En attente de ton accord avant toute correction.*
