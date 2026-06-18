# 📒 Récapitulatif de nos échanges — Audit & Améliorations
*Livraison Rapide OUAGA et BOBO — Session du 18 juin 2026. Ce document rassemble tout ce qu'on s'est dit pour que tu puisses le relire plus tard.*

---

## SOMMAIRE
1. [Où on en était](#1)
2. [Phase 4 — Feuille de route d'amélioration](#2)
3. [Mon avis stratégique (à lire absolument)](#3)
4. [Travaux réalisés cette session (CNI + index chat)](#4)
5. [Description des 3 interfaces (Client / Livreur / Admin)](#5)
6. [Maquettes d'amélioration](#6)
7. [Questions en attente de ta réponse](#7)
8. [Prochaines étapes proposées](#8)

---

<a name="1"></a>
## 1. OÙ ON EN ÉTAIT

Les **Phases 1, 2 et 3** de l'audit étaient déjà terminées lors de sessions précédentes :
- 📄 `FICHE_IDENTITE_APP.md` — concept, rôles, parcours, fonctionnalités (Phase 1)
- 📄 `RAPPORT_TEST_PHASE3.md` — tableau des tests, bugs, plan de correction (Phases 2 & 3)
- 🔴 La **faille de sécurité critique** (n'importe qui pouvait devenir admin via `user_metadata`) a été **corrigée, déployée et re-vérifiée** en production le 11 juin (script `CORRECTIF_SECURITE_URGENT.sql`).

**Concept de l'app (rappel) :** ce n'est pas une app de commande de repas. C'est un **annuaire de livreurs géolocalisés**. Le client paie **500 FCFA** pour débloquer la carte, voit les livreurs autour de lui et **les contacte directement** (appel / chat). C'est une **mise en relation**, pas une commande formelle.

---

<a name="2"></a>
## 2. PHASE 4 — FEUILLE DE ROUTE D'AMÉLIORATION

Livrée dans 📄 **`FEUILLE_DE_ROUTE_AMELIORATION.md`** (document détaillé). Résumé des priorités :

### ① À faire en premier (fort impact + facile)
| # | Amélioration | État |
|---|---|---|
| 4.1 | Carte : ne charger que les colonnes utiles + **ne plus exposer les CNI** | ✅ **FAIT** (voir §4) |
| 5.1 | Index combiné sur le chat | ✅ **FAIT** (voir §4) |
| 3.1 | Inciter à laisser un avis après un contact | à faire |
| 2.3 | Brancher / clarifier le bouton abonnement livreur | partiellement fait |

### ② Ensuite (fort impact, plus de travail)
- 4.2 Miniatures de photos + chargement progressif
- 4.3 Gestion des coupures réseau + messages clairs
- 2.1 Tableau de bord livreur « Contacts du jour / Vues / Note »
- 3.2 « Mes livreurs récents » / favoris (existe déjà en partie)
- 1.1 Fiche « mise en relation » (historique des deux côtés)

### ③ Plus tard
- 1.3 / 2.2 Statut Disponible / Occupé du livreur
- 5.2 Pagination des listes admin
- 5.3 Nettoyage automatique des abonnements push périmés
- 3.3 Simplifier le paiement, puis API Orange/Moov Money
- 2.4 Afficher le prénom du client au livreur (partiellement fait)
- 3.4 Distance / temps estimé — *je déconseille pour l'instant (faux en ville)*
- 4.4 Accélérer le premier chargement
- 1.2 Recours « livreur injoignable »
- 5.4 Index `deblocages (client_id, created_at)`

---

<a name="3"></a>
## 3. MON AVIS STRATÉGIQUE (à lire absolument)

**⚠️ La faille de ton modèle économique :** un client paie 500 F, débloque un numéro… puis **enregistre le numéro** dans son téléphone et appelle directement la prochaine fois, **sans repasser par l'app**. Tu gagnes 500 F une seule fois et tu perds le client *et* le livreur.

**Mes recommandations :**
1. **Arrête de vendre « le numéro »** (qui fuit dès le 1er appel). Vends **l'accès et la commodité** :
   - Un **« pass » temporaire** : 500 F = accès à toute la carte pendant 24–72 h (autant de livreurs que voulu). *(Note : tu as déjà une brique de ça — le Premium client à 5000 F/mois.)*
   - Mets la valeur dans ce qui ne se copie pas : carte temps réel, avis, livreur « disponible maintenant », chat intégré.
2. **Ta meilleure source de revenus à terme = les abonnements livreurs** (500 F/semaine), pas les 500 F clients. Les livreurs ne peuvent pas « copier » leur présence sur la carte. → Mise beaucoup sur le tableau de bord livreur (lui montrer qu'il travaille grâce à l'app).

**Idées neuves recommandées :**
- **Bouton WhatsApp** (`wa.me/numéro` pré-rempli) en plus de « Appeler » — très utilisé au Burkina.
- **Page « Confidentialité / Protection des données »** courte (tu manipules des CNI → rassure et protège).

**Ce que je déconseille pour l'instant :** distance/temps à vol d'oiseau (trompeur en ville), API Orange/Moov Money (souvent dur à obtenir pour un petit opérateur — à garder en objectif).

---

<a name="4"></a>
## 4. TRAVAUX RÉALISÉS CETTE SESSION

### ✅ Point 1 — Fuite des CNI fermée
**Problème trouvé :** pour afficher la carte, l'app faisait `select('*')` sur la vue `livreurs_view`, qui contient les **URLs des pièces d'identité (CNI recto/verso)**. Résultat : les liens des CNI de tous les livreurs partaient dans le navigateur de chaque visiteur, et restaient lisibles via l'API publique.

**Corrigé en deux endroits :**
- **Code** — `hooks/useLivreursRealtime.ts` : sélection de colonnes explicites (constante `LIVREUR_PUBLIC_COLUMNS`), **sans** `cni_recto` / `cni_verso`.
- **Base** — script `AMELIORATION_1_2.sql` : recrée `livreurs_view` **sans** les colonnes CNI. *(L'admin continue de voir les CNI : il les lit depuis la table `livreurs`, protégée — pas depuis la vue.)*

**Vérifié :** lecture des CNI via l'API publique = **BLOQUÉE** (« column does not exist ») ; la carte fonctionne toujours (livreurs lus normalement). Aucune régression.

### ✅ Point 2 — Index chat ajouté
Index combiné `idx_chats_pair_created (rider_id, client_id, created_at)` créé sur `chats_livraison` (via le même script SQL) → l'ouverture d'une conversation restera rapide même avec beaucoup de messages.

### Déploiement
- **Commit `12868bc` poussé sur `main`** → déployé via Vercel.
- **Script SQL `AMELIORATION_1_2.sql` exécuté par toi dans Supabase** (confirmé).

---

<a name="5"></a>
## 5. DESCRIPTION DES 3 INTERFACES

### 👤 Client
Connexion par numéro + code PIN. Tableau de bord « Mon Compte Client » :
- Badge *Compte Gratuit* ou *Client Premium ⭐*
- Si gratuit → encadré « Devenir Premium » + bouton **« Passer Premium (5000 FCFA / mois) »** (accès illimité au lieu de 500 F/recherche)
- Si premium → bouton **« Lancer la recherche automatique »**
- Section **« Livreurs Consultés »** (depuis `deblocages`)
- Section **« Discussions Récentes »** (3 derniers chats, cliquables)
- Bouton « Se déconnecter »
Autour : carte, fiche livreur (appeler/discuter), chat, paiement (capture lue par l'IA), avis.

> 💡 « Mes livreurs récents » et le modèle « pass » existent déjà en partie (Livreurs Consultés + Premium mensuel).

### 🛵 Livreur
Connexion ou inscription (nom, véhicule, ville, photos CNI recto/verso + selfie compressées). Tableau de bord :
- En-tête « Bonjour, [prénom] » + véhicule
- Carte de statut : Statut (En attente / Disponible / Suspendu) + Visibilité (🟢/🔴)
- Widget « 📍 Position GPS en Direct » + bouton « ⚡ Actualiser »
- 3 stats : Mises en Relation (x/4 offertes), Clics Profil, Temps restant avant facturation
- « ⭐ Notes & Avis Clients »
- « Messages Clients » (liste des conversations + non lus → ouvre le chat)
- « ℹ️ Suivi de votre abonnement » + bouton « Régler mon abonnement (500 FCFA) » si suspendu

> 💡 Modèle confirmé dans le code : **4 mises en relation offertes, puis 500 FCFA / semaine** (abonnement **hebdomadaire**). Le bouton de paiement est maintenant relié (bug M4 corrigé). Le nom du client vient d'une fonction sécurisée `get_my_chat_clients` (repli « Client »).

### 🛡️ Admin
Connexion 67 37 09 09 + mot de passe (compte `admin@livraison.com`, rôle dans `app_metadata`). « Espace Administration » à onglets :

| Onglet | Rôle |
|---|---|
| Vue d'ensemble | Cartes de chiffres clés |
| Discussions en direct | Voir les conversations |
| Gestion des Livreurs | Liste + recherche + export CSV |
| Candidatures en Attente | Validation + **Inspecteur 🪪** (CNI + selfie) → Valider / Suspendre / Badge vérifié / Supprimer |
| Gestion des Clients | Tableau + activer/retirer Premium + supprimer + CSV |
| Abonnements Premium | Clients premium |
| Analytiques | 14 derniers jours + Ouaga/Bobo |
| Statistiques Plateforme | Chiffres + sélecteur de période |
| Configuration & Communication | 💰 Tarifs, 📢 Annonce globale, 🔔 Push à tous |
| Litiges & Support | Tickets + Résoudre |
| Reçus de Paiement (IA) | Tableau + voir capture + CSV |

> 💡 L'Inspecteur CNI lit depuis la table `livreurs` (protégée) → non impacté par la correction d'aujourd'hui. À re-tester : l'onglet **Tarifs** (bug M3 signalé — affichait « sauvegardé » sans enregistrer).

---

<a name="6"></a>
## 6. MAQUETTES D'AMÉLIORATION

### 👤 Client — réduire les clics + recontacter en 1 geste
```
┌──────────────────────────────┐
│  Mon Compte         ⭐ Premium │
├──────────────────────────────┤
│   🔍   TROUVER UN LIVREUR      │ ← action n°1, gros bouton (1 tap)
│        autour de moi           │
├──────────────────────────────┤
│  Mes livreurs habituels        │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ 📷  │ │ 📷  │ │ 📷  │       │ ← recontact direct, sans re-chercher
│  │ Ali │ │Moussa│ │ Awa │       │
│  │📞 💬 🟢│ │📞 💬│ │📞 💬│       │   (🟢 = en ligne)
│  └─────┘ └─────┘ └─────┘       │
├──────────────────────────────┤
│  💬 Discussions récentes    >  │
│  • Ali      « j'arrive… »  2m  │
│  • Moussa   « ok merci »   1h  │
└──────────────────────────────┘
```
Changements : action principale en haut (moins de clics) ; livreurs habituels avec Appeler/Chat/WhatsApp directs (fidélisation, 3.2) ; pastille « disponible maintenant ».

### 🛵 Livreur — pensé « en déplacement » : gros boutons, l'essentiel d'abord
```
┌──────────────────────────────┐
│ Bonjour Issa 🛵        ★ 4.8  │
├──────────────────────────────┤
│ ┌─────────────┬──────────────┐│
│ │ 🟢 DISPONIBLE│   OCCUPÉ     ││ ← gros interrupteur (1 tap)
│ └─────────────┴──────────────┘│
├──────────────────────────────┤
│   Contacts          Vues       │
│   AUJOURD'HUI      du jour     │
│      3                12       │ ← gros chiffres motivants
├──────────────────────────────┤
│ 💬 Messages          2 nouveaux│
│ ● Awa     « vous êtes où ? »  │ ← messages non lus en haut
│ ● Client  « bonjour »         │
├──────────────────────────────┤
│ 📍  ACTUALISER MA POSITION     │ ← bouton pleine largeur
├──────────────────────────────┤
│ Abonnement actif — 3 j restants│
│ [ Régler 500 F / semaine ]     │
└──────────────────────────────┘
```
Changements : interrupteur Dispo/Occupé en haut (1.3/2.2) ; « Contacts aujourd'hui » mis en avant (2.1) ; messages non lus remontés ; GPS en gros bouton (2.5).

### 🛡️ Admin — une liste « à traiter en priorité »
```
┌─────────────────────────────────────────┐
│ Espace Admin            🔔   Déconnexion  │
├─────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌──────────────┐  │
│ │Livreurs│ │Clients │ │ Revenus 7j   │  │
│ │   31   │ │   48   │ │  24 500 F    │  │
│ └────────┘ └────────┘ └──────────────┘  │
├─────────────────────────────────────────┤
│ ⚡ À TRAITER EN PRIORITÉ                  │
│  • 4 candidatures en attente     [Voir]  │
│  • 2 litiges non résolus         [Voir]  │
│  • 1 reçu de paiement à vérifier [Voir]  │
├─────────────────────────────────────────┤
│ 📈 Activité 7 jours                       │
│  Ouaga 70%  ▓▓▓▓▓▓▓░░░  Bobo 30%          │
└─────────────────────────────────────────┘
```
Changements : bloc « À traiter en priorité » qui agrège les décisions en attente (l'admin sait quoi faire sans fouiller les onglets) ; revenus réels en un coup d'œil.

---

<a name="7"></a>
## 7. QUESTIONS EN ATTENTE DE TA RÉPONSE
1. **Statut Disponible/Occupé :** le livreur « occupé » *disparaît* de la carte ou reste *en gris* ?
2. **Livreur injoignable :** si un livreur ne répond pas, on offre un 2ᵉ déblocage gratuit, ou non (pour protéger tes revenus) ?
3. **Paiement :** as-tu accès à une **API marchand Orange Money / Moov Money** ?
4. **Abonnement livreur :** confirmé hebdomadaire à 500 F ? *(le code dit « hebdomadaire » — à valider)*

---

<a name="8"></a>
## 8. PROCHAINES ÉTAPES PROPOSÉES
Dans l'ordre conseillé, dès ton feu vert :
1. **Réparer/inciter les avis (3.1)** + finaliser le bouton abonnement livreur (2.3) — faciles, fort impact.
2. **Refonte du tableau de bord livreur** (maquette ci-dessus) — fort impact sur tes revenus d'abonnement.
3. **Miniatures de photos (4.2)** + gestion réseau (4.3) — performance sur téléphones faibles.
4. **Trancher le modèle « pass » vs « numéro »** (§3) avant de pousser plus loin la fidélisation client.

> Je ne code rien sans ton accord. Dis-moi par quoi commencer.

---
*Document généré le 18 juin 2026. Mis à jour au fil de nos échanges.*
