# 📋 RAPPORT DE TEST COMPLET — Livraison Rapide
*Phase 2 & 3 de l'audit — 11 juin 2026. Tests réels via Microsoft Edge (Playwright) sur l'app lancée en local, branchée sur la vraie base Supabase. Toutes les données de test ont été supprimées à la fin.*

---

## 1. ÉTAT GÉNÉRAL (verdict en 3 lignes)
L'application **fonctionne bien dans son cœur** : la carte, l'inscription des livreurs, la connexion, le chat en temps réel et l'espace admin sont opérationnels.
**MAIS elle n'est PAS prête pour de vrais clients** à cause d'une **faille de sécurité critique** (n'importe qui peut devenir administrateur et voler toutes les données + contourner le paiement) et de **trois fonctions cassées** (inscription client impossible, système d'avis inopérant, connexion admin officielle cassée).
👉 Il faut corriger la sécurité **avant toute mise en avant publique**. Le reste est réparable rapidement.

---

## 2. TABLEAU DES TESTS

| Fonctionnalité | Profil | Résultat | Commentaire |
|---|---|---|---|
| Page d'accueil + carte | Visiteur | ✅ | Charge bien, 31 livreurs affichés |
| Choix ville / portail localisation | Visiteur | ✅ | Ouaga/Bobo OK |
| Paywall 200 FCFA | Visiteur | ✅ | Bloque bien la carte (même en période gratuite) |
| Switch ville, "Détecter un livreur" | Visiteur | ✅ | Ouvre la fiche du plus proche |
| Fiche livreur (appeler/discuter) | Visiteur | ✅ | Téléphone visible (période gratuite) |
| Chat sans être connecté | Visiteur | ✅ | Invite à se connecter (correct) |
| **Inscription client** | Client | 🔴 ❌ | **Aucun bouton pour créer un compte client dans l'app** |
| Connexion mauvais PIN | Client | ✅ | Message "Numéro ou code PIN incorrect" |
| Champs vides | Client | ✅ | Formulaire bloque (champs requis) |
| Connexion bon PIN | Client | ✅ | Ouvre le tableau de bord |
| Écran Premium (5000 F) | Client | ✅ | S'ouvre (test arrêté avant paiement réel) |
| **Chat : envoi message** | Client | ✅ | Message affiché ET enregistré en base ✓ |
| **Laisser un avis** | Client | 🔴 ❌ | **La fenêtre d'avis s'ouvre invisible ; et l'enregistrement échouerait (colonne `rating` absente)** |
| Inscription livreur + photos | Livreur | ✅ | Compte créé, statut "en attente", photos uploadées ✓ |
| Connexion + tableau de bord | Livreur | ✅ | Statut, GPS, stats, messages affichés |
| Réception message client | Livreur | ✅ | Message reçu et visible |
| Chat réponse livreur→client | Livreur | ✅ | S'ouvre correctement |
| Nom du client dans le chat | Livreur | 🟡 | Affiche "Client" au lieu du vrai nom (RLS) |
| **Connexion admin officielle** (67 37 09 09 / 1234) | Admin | 🔴 ❌ | **Échoue : le compte `admin@livraison.com` visé par le code n'existe pas** |
| Tableau de bord admin (via compte test) | Admin | ✅ | Toutes les cartes présentes |
| Candidatures + inspecteur (photos) | Admin | ✅ | Voit les documents |
| Valider une candidature | Admin | ✅ | Statut passé à "actif" en base ✓ |
| Statistiques / Litiges | Admin | ✅ | Affichent les données |
| Isolation client (ne voit pas les autres) | Sécurité | ✅ | Clients, paiements, chats, push : tout bloqué ✓ |
| Client tente de modifier un livreur | Sécurité | ✅ | Bloqué ✓ |
| **Faux admin (role dans user_metadata)** | Sécurité | 🔴 ❌ | **Accès TOTAL en lecture ET écriture** |

---

## 3. BUGS CLASSÉS PAR GRAVITÉ

### 🔴 BLOQUANT (à corriger avant ouverture au public)

**B1 — N'importe qui peut devenir administrateur et tout voler.**
En s'inscrivant, un utilisateur choisit lui-même son "rôle". En mettant `role = admin`, il obtient **tous les pouvoirs admin** sur la vraie base :
- lire **tous les clients** (noms + téléphones),
- lire **tous les livreurs avec leur numéro en clair** → le paiement de 200 F ne sert plus à rien (modèle économique contourné),
- lire **toutes les conversations privées** et les tickets,
- lire les **313 abonnements de notification**,
- **modifier ou supprimer n'importe quel livreur** (testé : j'ai pu suspendre un livreur de test).
*Preuve : un compte créé avec ce seul réglage a lu 313 abonnements et les numéros bruts des livreurs.*
**Cause :** la base de production fait encore confiance au champ "rôle" modifiable par l'utilisateur (`user_metadata`). Le correctif existe déjà dans votre projet (`fix_security_v2.sql`) mais **n'a jamais été exécuté sur la base de production**.

**B2 — Un nouveau client ne peut pas créer de compte.**
L'écran de connexion ne propose que "Se connecter" — aucun lien "Créer un compte client". Seuls les livreurs peuvent s'inscrire ("Devenir livreur"). Conséquence : aucun nouveau client ne peut s'inscrire, donc ni chat ni avis possibles pour eux. *(Le code d'inscription client existe mais n'est relié à aucun bouton visible.)*

**B3 — Le système d'avis est doublement cassé.**
1. En cliquant sur "(0 avis)", la fenêtre d'avis s'ouvre **totalement invisible** (un réglage d'affichage `opacity:0` n'est jamais activé). L'utilisateur ne voit rien.
2. Même si on la rendait visible, l'enregistrement **échouerait** : le code envoie une colonne `rating` qui n'existe pas (la base attend `stars`). *(Confirmé : table `avis` vide, 0 avis depuis le début.)*

**B4 — La connexion administrateur officielle est cassée.**
Se connecter avec le numéro admin (67 37 09 09) et le code 1234 échoue, car le code redirige vers un compte `admin@livraison.com` **qui n'existe pas**. Le vrai compte admin est `67370909@livraison.com` avec un autre mot de passe. De plus, un **compte client parasite** existe sur ce même numéro (`22667370909@livraison.com`).

### 🟠 GÊNANT

**G1 — Tous les numéros de livreurs sont publics actuellement.** À cause de la période gratuite (jusqu'au 1er juillet 2026), la carte montre les numéros à tout visiteur ayant passé le paywall. Combiné à B1, l'exposition est totale. *(Choix volontaire au lancement, mais à surveiller.)*

**G2 — 313 abonnements de notifications** pour une quarantaine de comptes : beaucoup sont périmés et alourdiront les envois. À nettoyer.

### 🟡 MINEUR

- **M1** — Dans le portail de choix de ville, le compteur indique "0 livreurs actifs" alors que la carte en affiche 31 (compteur non synchronisé).
- **M2** — Côté livreur, le client apparaît comme "Client" au lieu de son vrai nom (le livreur n'a pas le droit de lire la fiche client — comportement de sécurité, mais l'affichage devrait être adapté).
- **M3** — Les champs "Tarifs" de l'admin affichent "sauvegardé" mais ne sauvegardent rien (valeurs figées dans le code).
- **M4** — Le bouton "Régler mon abonnement (500 FCFA)" du livreur n'a aucune action.

---

## 4. PROBLÈMES DE BASE DE DONNÉES

| Sujet | Constat |
|---|---|
| Isolation visiteur non connecté | ✅ Correcte : aucune table lisible sans compte |
| Isolation entre clients connectés | ✅ Correcte : un client ne voit que ses données |
| **Politiques de sécurité (RLS)** | 🔴 **Font confiance au rôle modifiable par l'utilisateur** → voir B1. Le correctif `fix_security_v2.sql` doit être appliqué. |
| Table `avis` | 🔴 Colonne attendue par le code (`rating`) ≠ colonne réelle (`stars`) → voir B3 |
| Anti-fraude paiements | ✅ Un même reçu ne peut être utilisé deux fois |
| Liens entre tables | ✅ Cohérents (aucun déblocage/chat orphelin) |
| Compte parasite | 🟠 `22667370909@livraison.com` (client) sur le numéro de l'admin |
| Abonnements push | 🟠 313 lignes, beaucoup périmées |

---

## 5. PLAN DE CORRECTION (ordonné par priorité)

1. **🔴 Sécurité d'abord (URGENT).** Appliquer `fix_security_v2.sql` sur la base de production (via l'éditeur SQL Supabase) pour que les droits ne se basent plus QUE sur `app_metadata`. Puis **re-tester le scénario du faux admin** pour confirmer la fermeture de la faille. Corriger aussi la politique des abonnements push qui accepte encore `user_metadata`.
   *Pourquoi : empêche le vol de toutes les données et le contournement du paiement.*

2. **🔴 Rétablir la connexion admin (B4).** Décider d'un seul vrai compte admin et aligner le code (`AuthDrawer`) sur ce compte réel, ou créer le compte `admin@livraison.com` attendu. Supprimer/clarifier le compte client parasite sur le numéro admin.
   *Pourquoi : sans cela, vous ne pouvez plus accéder à votre propre back-office.*

3. **🔴 Réparer le système d'avis (B3).** Aligner le code sur la vraie colonne (`stars`) et rendre la fenêtre d'avis visible (ajouter la classe d'ouverture). Rendre le commentaire vraiment optionnel.

4. **🔴 Ajouter l'inscription client (B2).** Relier un bouton "Créer un compte client" à l'écran d'inscription qui existe déjà dans le code.

5. **🟠 Nettoyer les abonnements push périmés** et corriger le compteur de ville (M1).

6. **🟡 Finitions :** brancher les champs Tarifs et le bouton d'abonnement livreur, ou les masquer ; afficher un libellé propre côté livreur pour le client.

> ⏸ **Je n'ai encore rien corrigé.** J'attends votre accord pour passer aux corrections, dans l'ordre ci-dessus.

---

## 6. SUGGESTIONS D'AMÉLIORATION

1. **Confirmation de paiement plus simple** : le client doit faire une capture d'écran et la faire lire par l'IA — pratique mais source d'erreurs. Envisager à terme une intégration directe Orange Money / Moov (API marchand) pour automatiser.
2. **Vérification du téléphone** : aujourd'hui l'inscription ne vérifie pas le numéro (pas de SMS). Un code de vérification réduirait les faux comptes.
3. **Notation après contact réel** : déclencher l'invitation à laisser un avis automatiquement après un appel/déblocage, pour augmenter le nombre d'avis (une fois le système réparé).
4. **Tableau de bord livreur enrichi** : afficher le numéro (masqué) du client et l'historique des contacts pour faciliter le suivi.
5. **Page "Mentions / Confidentialité"** : comme l'app manipule des pièces d'identité (CNI), une courte page expliquant la conservation et la protection des données rassurerait les utilisateurs et les livreurs.
