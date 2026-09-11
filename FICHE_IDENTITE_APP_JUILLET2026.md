# FICHE D'IDENTITÉ DE L'APP — Livraison Rapide (7 juillet 2026)

> **Phase 1 de l'audit** — établie en croisant 3 sources :
> 1. **Navigation réelle** de l'app (captures d'écran dans `scratch/audit2_screens/`)
> 2. **Lecture complète du code source**
> 3. **Analyse de la base Supabase en lecture seule** (scripts `scratch/audit2_db_readonly.mjs` et `scratch/audit2_db_coherence.mjs` — aucune donnée modifiée)
>
> Note : Kaspersky (l'antivirus de ce PC) bloque livraisonrapide.app dans le navigateur. L'exploration a donc été faite sur une copie locale **identique** au site en ligne (version `2026-07-07_v8` vérifiée en production). En naviguant, l'app enregistre automatiquement 1 ligne de visite et des compteurs de vues — comme pour n'importe quel visiteur ; rien d'autre n'a été écrit.

---

## 1. LE CONCEPT EN 5 LIGNES

Livraison Rapide est une **carte en temps réel des livreurs disponibles** à Ouagadougou et Bobo-Dioulasso.
Un client (même sans compte) ouvre l'app, choisit sa ville ou son quartier, voit les livreurs actifs autour de lui avec leur photo, leur note et leur moyen de transport, puis les contacte **directement par téléphone ou par chat**.
L'app ne gère **pas de commande ni de paiement** : c'est une **mise en relation** — le client et le livreur s'arrangent ensuite entre eux.
Les livreurs s'inscrivent gratuitement avec leur CNI et un selfie ; l'administrateur valide chaque dossier avant qu'ils apparaissent sur la carte.
Depuis fin juin, l'app est **100 % gratuite** pour tout le monde (les anciens paiements de 200 F / abonnements ont été supprimés).

---

## 2. LES PROFILS ET CE QUE CHACUN PEUT FAIRE

| Profil | Comment on le devient | Ce qu'il peut faire |
|---|---|---|
| **Visiteur** (sans compte) | Rien à faire | Voir la carte et les livreurs actifs (photo, nom, note, transport, **téléphone en clair**, distance), appeler un livreur, lire les avis, choisir ville/quartier, installer l'app (PWA). Il ne peut PAS : chatter, donner un avis, signaler. |
| **Client** | Inscription : nom + téléphone + code PIN | Tout ce que fait le visiteur + chat avec les livreurs (texte, photo, fichier, partage de position), tableau de bord (discussions récentes), donner un avis, envoyer un signalement, notifications push, supprimer son compte. |
| **Livreur** | Inscription : nom + téléphone + PIN + moto/tricycle/voiture + position GPS + CNI recto/verso + selfie | Tableau de bord : statut du compte (en attente / actif / suspendu), visibilité sur la carte, mise à jour de sa position GPS, statistiques (mises en relation, clics profil), messagerie clients en temps réel, déconnexion. Il n'apparaît sur la carte **que si l'admin l'a validé**. |
| **Admin** | Compte spécial (téléphone 67 37 09 09), rôle fixé **côté serveur** (non falsifiable) | Dashboard complet : gestion livreurs (valider / suspendre / badge vérifié / supprimer, inspection CNI+selfie), gestion clients (supprimer, export CSV), lecture de tous les chats, litiges & support (résoudre / rouvrir / supprimer / suspendre le livreur concerné), gestion des avis (supprimer), annonces in-app, notification push à tous, analytiques 14 jours, statistiques plateforme. |

**Comment la connexion fonctionne** : pas d'e-mail — le numéro de téléphone est transformé en e-mail virtuel (`226XXXXXXXX@livraison.com`) + le PIN sert de mot de passe. Le rôle admin ne peut venir QUE du serveur (`app_metadata`), vérifié et sécurisé (re-testé le 7 juillet : un faux admin n'a accès à rien).

---

## 3. LE PARCOURS COMPLET DE A À Z

**Côté client :**
1. Arrivée sur l'accueil → « Lancer la recherche »
2. Choix de la ville (Ouagadougou / Bobo-Dioulasso), ou « Recherche automatique » (GPS)
3. Nouveau choix : « Voir la carte en direct » **ou** « Choisir mon quartier / secteur » (76 quartiers à Ouaga, 80 à Bobo, avec recherche ; le quartier est localisé via OpenStreetMap)
4. La carte s'affiche avec les livreurs actifs (badge « 43 livreurs disponibles »), leur photo en marqueur
5. Clic sur un livreur (ou bouton « Livreur le plus proche ») → volet avec photo, nom, badge vérifié, note, distance, téléphone
6. **Appeler** (ouvre le téléphone) ou **Discuter** (chat — connexion demandée si pas de compte)
7. Le chat est en temps réel : texte, photo (appareil photo), fichier, partage de position GPS
8. Après la course, le client peut laisser une note (1-5 étoiles) + commentaire, et signaler un problème si besoin

**Côté livreur :**
1. « Devenir livreur » → formulaire : nom, téléphone, mot de passe, transport, géolocalisation GPS (ou quartier manuel), CNI recto + verso + selfie (photos compressées automatiquement, protégées contre les réseaux lents)
2. Le compte est créé avec le statut **« en attente »** → invisible sur la carte
3. L'admin examine le dossier (photos, CNI) dans son dashboard et **valide** → le livreur devient « actif » et apparaît sur la carte
4. Le livreur reçoit les messages clients en temps réel dans son tableau de bord et peut actualiser sa position GPS
5. L'admin peut le suspendre (disparaît de la carte) ou lui décerner le badge « Profil Vérifié » (coche bleue)

**Côté admin :**
Connexion avec le numéro admin → dashboard : valide les candidatures, surveille les chats, traite les signalements (« Litiges & Support »), gère les avis, publie des annonces (bandeau in-app) et des notifications push à tous les appareils.

---

## 4. LISTE EXHAUSTIVE DES FONCTIONNALITÉS

### Visibles en navigation (testées à l'écran)
- Accueil avec logo, « Se connecter », « Devenir livreur », WhatsApp/téléphone support
- Portail de localisation en 3 étapes (ville → mode → carte ou quartier) + recherche automatique GPS
- Carte Leaflet/OpenStreetMap temps réel, marqueurs photo, compteur de livreurs en ligne, bouton « ma position », bouton « Livreur le plus proche », commutateur Ouaga/Bobo
- Volet livreur : photo, nom, badge vérifié, statut disponible, transport, note et nombre d'avis, distance, téléphone, Appeler, Discuter
- Fenêtre « Notes & Avis Clients » : moyenne, liste des avis, formulaire (étoiles + commentaire)
- Connexion unifiée (téléphone + PIN, œil pour afficher le PIN), inscription client, inscription livreur (avec upload de 3 photos)
- Pages légales : politique de confidentialité (11 sections), suppression de compte
- PWA installable (manifest + service worker + bannière d'installation + purge de cache automatique à chaque mise à jour)

### Présentes dans le code (invisibles ou réservées)
- **Formulaire de signalement** (`ReportModal`) : décrire un problème → table `tickets_support` → dashboard admin. **⚠️ Codé et fonctionnel mais AUCUN bouton ne l'ouvre actuellement** (le bouton « Signaler » a été retiré du volet livreur, comme le bouton doré « Donner un avis »)
- **Dashboard admin complet** (8 modules) : vue globale, discussions, gestion livreurs + inspecteur de dossier (CNI/selfie), candidatures en attente, gestion clients + export CSV, analytiques journalières (graphiques 14 jours), statistiques (visites, clics, dossiers incomplets), litiges & support (filtres, résoudre/rouvrir/supprimer, suspendre le livreur), gestion des avis (supprimer), annonces, push broadcast
- **Tableau de bord livreur** : statut, visibilité, GPS, stats, messagerie temps réel
- **Tableau de bord client** : discussions récentes, « livreurs consultés », recherche automatique
- **Notifications push** (VAPID) : enregistrement automatique des appareils connectés + envoi groupé par l'admin + API `/api/push`
- **Suppression de compte** (`/api/account/delete`) : efface chats, avis, signalements, abonnements push, profil, compte (exigence App Store)
- **Annonces in-app** : bandeau affiché une fois par session à tous les utilisateurs
- **Réparation automatique « livreur fantôme »** à l'inscription (si le profil n'a pas été créé la 1ʳᵉ fois)
- Protection anti-doublon des abonnements push ; compression d'images ; délais de sécurité réseau lent

### Dans la base de données (11 tables/vues)
| Table | Rôle | État actuel |
|---|---|---|
| `livreurs` | Profils livreurs (téléphone, GPS, CNI, selfie, statut, stats) | **44 livreurs, tous « actif »** (43 Ouaga / 1 Bobo, 6 vérifiés) |
| `livreurs_view` | Vue **publique** de la carte (sans CNI, téléphone en clair) | 44 lignes |
| `clients_livraison` | Profils clients | 6 clients |
| `chats_livraison` | Messages du chat (texte, image, heure) | 1 message |
| `avis` | Notes et commentaires | **0 avis** |
| `tickets_support` | Signalements (litiges) | 1 (résolu) |
| `annonces` | Annonces in-app de l'admin | 0 active |
| `push_subscriptions` | Appareils enregistrés pour les notifications | 64 appareils |
| `plateforme_visites` | Compteur de visites | 529 visites |
| `paiements` | **Héritage ère payante** (reçus 200/500 F) | 5 anciens paiements |
| `deblocages` | **Héritage ère payante** (accès numéro contre 200 F) | 0 ligne |

**Liens entre tables** : tout tourne autour de `client_id` → `clients_livraison` et `rider_id` → `livreurs` (chats, avis, signalements). Les profils sont créés automatiquement à l'inscription par un déclencheur serveur.

**Sécurité (règles RLS) — re-testée le 7 juillet en conditions réelles :**
- ✅ Un anonyme ne peut lire AUCUNE table sensible (clients, chats, signalements, push, téléphones bruts) — seule la vue publique répond
- ✅ Un faux admin (rôle trafiqué côté client) n'a accès à rien et ne peut rien modifier
- ✅ Le vrai admin (rôle serveur) a tous les accès (tickets avec noms/téléphones, avis, etc.)
- ✅ Le flux signalement complet a été testé en prod : client → insertion → lecture admin → résoudre → rouvrir → supprimer
- ✅ La vue publique n'expose plus les CNI (l'ancienne fuite est corrigée)

---

## 5. ÉCARTS ET BIZARRERIES DÉTECTÉS

### 🔴 Importants
1. **Avis probablement bloqués depuis le 2 juillet.** La table `avis` est **vide** (0 avis). Or l'ancienne règle de sécurité n'autorise un avis que pendant la « période gratuite » qui s'est **terminée le 02/07/2026** (ou après un déblocage payant — qui n'existe plus). Le script `scratch/migration_free.sql` qui corrige cette règle existe dans le projet mais je n'ai **pas la preuve qu'il a été exécuté en prod**. Si ce n'est pas le cas, **plus personne ne peut laisser d'avis**. → À tester en tout premier en Phase 2.
2. **Le signalement est inaccessible.** Le formulaire, la base et le dashboard admin fonctionnent (testés), mais plus aucun bouton ne l'ouvre depuis le retrait des boutons du volet livreur. Fonctionnalité fantôme.
3. **Le bucket de stockage « identities » (CNI + selfies des livreurs) est PUBLIC.** Les adresses des fichiers sont difficiles à deviner, mais quiconque obtient un lien peut voir une CNI sans être connecté. Le bucket `recus-paiements` est public aussi (héritage).

### 🟠 Gênants
4. **La section « Notes & Avis » du tableau de bord livreur est factice** : elle affiche toujours « 5.0 / Basé sur 0 avis / Aucun avis reçu » — elle n'est jamais branchée à la base. Le livreur ne verra jamais ses vrais avis.
5. **« Livreurs Consultés » du tableau de bord client est mort** : il lit la table `deblocages` qui ne se remplit plus depuis le passage au gratuit. Restera vide pour toujours.
6. **3 livreurs « actif » sans AUCUN document** (ni selfie ni CNI) : parfait ouattara, Compaore Malgrenoma, Olivier Nikiema — visibles sur la carte sans vérification possible.
7. **10 comptes livreur « fantômes »** (compte créé mais profil jamais enregistré), dont **5 comptes de test oubliés en prod** (ghost7402, ghost52631, testbug14327, testupload7002, test27114) datant du débogage de juin.
8. **Kaspersky bloque le site** (« site susceptible de provoquer une fuite de données ») : des visiteurs équipés de cet antivirus verront un écran de blocage au lieu de l'app.

### 🟡 Mineurs
9. Le statut « En ligne » affiché dans le chat est décoratif (toujours vert, même si l'autre est parti).
10. Code mort hérité de l'ère payante : `usePaymentSimulation` (simulation Orange/Moov Money), 5 paiements orphelins (clients supprimés), tables `deblocages`/`paiements`, imports inutilisés dans la page principale.
11. Un PIN court est complété par un suffixe fixe connu (`_secure_pad`) : un PIN de 4 chiffres ne représente que 10 000 combinaisons possibles. Acceptable pour ce type d'app, mais à connaître.
12. Le compteur de visites enregistre le « user agent » du navigateur comme identifiant de session (peu fiable pour dédupliquer).
13. Déséquilibre des villes : 43 livreurs à Ouaga contre 1 seul à Bobo.
14. 3 comptes admin coexistent (admin@, 67370909@, 22667370909@livraison.com) — un seul suffirait.
15. Travail en cours non déployé sur ce PC : nouvelle image d'accueil (monument) dans `WelcomePortal` — modifié localement, pas encore mis en ligne.

---

## 6. PLAN DE TEST — PHASE 2 (après ta validation)

Tous les tests se feront avec des **comptes de test dédiés** (numéros fictifs type 08 00 00 XX), **capture d'écran + vérification en base** pour chacun, et **nettoyage complet** à la fin. Aucun vrai compte client/livreur ne sera utilisé ni modifié.

### A. Visiteur (sans compte)
| # | Test |
|---|---|
| A1 | Accueil → recherche → choix ville → carte : les 43 livreurs s'affichent |
| A2 | Choix par quartier (ex : Ouaga 2000) : la carte se centre au bon endroit |
| A3 | « Livreur le plus proche » : ouvre bien le volet du bon livreur |
| A4 | Volet livreur : téléphone affiché, bouton Appeler fonctionne (lien tel:) |
| A5 | Lire les avis d'un livreur |
| A6 | Chat sans compte → doit demander la connexion ✔ (déjà vu) |
| A7 | Pages /confidentialite et /suppression-compte accessibles |

### B. Client (compte de test)
| # | Test |
|---|---|
| B1 | Inscription client + vérif ligne créée en base |
| B2 | Erreurs : PIN court, numéro déjà pris, champs vides, mauvais PIN à la connexion |
| B3 | Connexion / déconnexion / reconnexion |
| B4 | **⚠ PRIORITÉ — Donner un avis** (étoiles + texte) : vérifier si la règle du 2 juillet bloque. Si bloqué → correction à te proposer |
| B5 | Chat client → livreur de test : message texte + photo + position, vérif en base |
| B6 | Tableau de bord : discussions récentes s'affichent |
| B7 | Signalement : confirmer l'absence de bouton (et te demander si on le remet) |
| B8 | Suppression du compte de test via le bouton officiel : tout est bien effacé |

### C. Livreur (compte de test)
| # | Test |
|---|---|
| C1 | Inscription complète avec fausses photos (CNI factice de test) + vérif en base |
| C2 | Le nouveau livreur « en attente » est bien INVISIBLE sur la carte publique |
| C3 | Connexion livreur → tableau de bord : statut, stats |
| C4 | Mise à jour GPS : la position change en base et sur la carte |
| C5 | Chat livreur → client de test (réponse) : temps réel dans les deux sens |
| C6 | Livreur suspendu (via admin) : disparaît de la carte + message dans son dashboard |

### D. Admin (avec ton accord — sur les comptes de TEST uniquement)
| # | Test |
|---|---|
| D1 | Connexion admin (je te demanderai de te connecter toi-même ou de me donner l'accès au moment voulu — je ne connais pas le mot de passe actuel, c'est bien) |
| D2 | Valider la candidature du livreur test → il apparaît sur la carte |
| D3 | Badge vérifié : décerner puis retirer |
| D4 | Suspendre / réactiver / supprimer le livreur test |
| D5 | Litiges : recevoir le signalement test, résoudre, rouvrir, supprimer |
| D6 | Avis : voir et supprimer l'avis test |
| D7 | Annonce in-app : publier → visible côté client → désactiver |
| D8 | **Push broadcast : NON testé en réel** (64 vrais appareils recevraient la notification) — je vérifierai seulement que l'API refuse un non-admin |
| D9 | Export CSV livreurs/clients |
| D10 | Un non-admin ne voit jamais le dashboard (déjà validé, re-vérification rapide) |

### E. Sécurité et robustesse
| # | Test |
|---|---|
| E1 | Isolation du chat : le client A ne peut pas lire les messages du client B (en base) |
| E2 | Un livreur ne peut pas modifier le profil d'un autre livreur |
| E3 | Accès anonyme aux tables sensibles ✔ (déjà validé le 7 juillet) |
| E4 | Faux admin ✔ (déjà validé le 7 juillet) |

**Fin de Phase 2** : suppression de tous les comptes et données de test (je te le confirmerai), puis rapport complet Phase 3 (état général, tableau des tests, bugs classés 🔴🟠🟡, plan de correction, 3-5 suggestions).

---
*Document généré le 7 juillet 2026 — version en ligne auditée : `2026-07-07_v8` — captures : `scratch/audit2_screens/`*
