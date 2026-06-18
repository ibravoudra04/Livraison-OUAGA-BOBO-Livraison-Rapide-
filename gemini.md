# 💎 Fiche Technique & Documentation — Livraison Rapide OUAGA & BOBO

Ce document regroupe toutes les spécifications de l'application **"Livraison Rapide"**, y compris les fonctionnalités implémentées, la structure du projet, la base de données, les décisions de design graphique et des instructions claires pour qu'un futur modèle d'intelligence artificielle puisse maintenir et étendre cette base de code de manière cohérente.

---

## 📖 1. Présentation de l'Application
**"Livraison Rapide"** est une application web géo-localisée en temps réel conçue pour mettre instantanément en relation des clients et des livreurs indépendants à **Ouagadougou** et **Bobo-Dioulasso** (Burkina Faso). 

L'accent a été mis sur la **simplicité**, la **fluidité**, un **design d'inspiration africaine moderne (Savannah Clay Glassmorphism)** et une **sécurité absolue** des informations privées (notamment le masquage dynamique des numéros de téléphone côté serveur).

---

## 🛠️ 2. Technologies Utilisées
L'application repose sur une architecture sans framework lourds à l'avant-garde, privilégiant les performances mobiles :
* **Frontend** : 
  * **HTML5 Sémantique** pour la structure.
  * **CSS3 Vanilla** avec une architecture complète de variables personnalisées pour les animations et le design system premium.
  * **JavaScript Vanilla (ES6+)** pour l'intégralité de la logique dynamique de l'interface et de l'état global.
* **Cartographie & Géo-localisation** :
  * **Leaflet.js (v1.9.4)** : Moteur de carte haute performance.
  * **CartoDB Positron** : Fonds de carte épurés en nuance de gris clair, parfaits pour faire ressortir les marqueurs.
* **Backend & Base de données** :
  * **Supabase** : Intégration de la base PostgreSQL, de l'authentification (Sessions persistantes JWT) et de la messagerie en temps réel.
* **Hébergement & Déploiement** :
  * **Vercel** : Déploiement automatique continu à chaque commit sur GitHub. URL de production : [livraisonrapide.app](https://livraisonrapide.app).

---

## 💎 3. Décisions de Design & Charte Graphique
Le design de l'application a été conçu pour impressionner l'utilisateur dès le premier coup d'œil en alliant modernité occidentale (effet verre dépoli) et racines culturelles locales :

* **Palette de Couleurs (Savannah Flag Palette)** :
  * `--color-primary-red` (`#E85C4A`) : Rouge brique chaleureux / rappel du drapeau national.
  * `--color-primary-yellow` (`#F6CD56`) : Or de la savane pour les notes et éléments d'attention.
  * `--color-primary-green` (`#27AE60`) : Vert vif pour la disponibilité et les validations en ligne.
  * `--color-primary-brown` (`#8D5537`) : Brun argile d'Afrique pour les boutons principaux, titres et éléments de marque.
  * `--color-bg-warm` (`#FAF6F2`) : Beige sable pour un arrière-plan doux et agréable à lire sur mobile sous le soleil.
* **Glassmorphism Premium** :
  * Les tiroirs de bas de page (bottom sheets), les formulaires d'onboarding, le chat et le tableau de bord administrateur utilisent un fond semi-transparent à haute valeur de flou (`backdrop-filter: blur(20px) saturate(180%)`) avec des bordures blanches lumineuses très fines, créant un effet "verre liquide" ultra-premium.
* **Alertes Customisées (Toasts)** :
  * Les alertes système classiques du navigateur ont été remplacées par un système de notifications sur-mesure d'inspiration glassmorphism avec des **icônes vectorielles SVG épurées** (vert pour le succès, rouge pour l'erreur, jaune safran pour les alertes, marron terre pour les messages). Cela assure une apparence identique et haut de gamme sur tous les OS mobiles (iOS, Android, Windows).
* **Responsive Extrême** :
  * Les en-têtes et les boutons d'action se redimensionnent de manière fluide jusqu'aux écrans de **320px** de large. Le nom de l'entreprise s'adapte élégamment sur mobile compact au lieu d'être masqué, garantissant une exposition maximale de la marque.

---

## 🌟 4. Fonctionnalités Implémentées

### A. Espace Client (Recherche & Contact)
* **Portail d'Accueil** : Un écran d'entrée élégant avec une icône de loupe interactive géante pour démarrer la recherche.
* **Carte en Temps Réel** : Visualisation des livreurs disponibles autour de soi sous forme de repères de carte animés par un halo pulsant vert.
* **Balise de Géo-localisation** : Un phare bleu pulsant représente la position du visiteur s'il accepte le partage de sa position.
* **Filtrage Intelligent** : Les livreurs hors ligne ou suspendus n'apparaissent pas. Si l'utilisateur est géo-localisé, seuls les livreurs dans un rayon de 5 km s'affichent.
* **Masquage Sécurisé du Téléphone** : Par défaut, le numéro de téléphone des livreurs est masqué sous la forme `+226 76 •• •• ••` côté serveur PostgreSQL.
* **Simulation de Déverrouillage (Orange & Moov)** : Simulation interactive d'un écran Mobile Money complet. Le client saisit son numéro, valide un écran USSD push simulé avec code PIN à 4 chiffres et débloque le numéro pour 500 FCFA.
* **Passage au Premium** : Option d'abonnement mensuel de 5 000 FCFA pour débloquer tous les livreurs en illimité sans payer par profil.
* **Avis & Notes** : Système d'avis avec attribution d'étoiles. Pour éviter le spam, **seul un client ayant débloqué un livreur** peut lui soumettre une revue (contrôlé par contrainte unique RLS).
* **Messagerie Directe (Chat)** : Discussion en temps réel intégrée directement avec le livreur débloqué.

### B. Espace Livreur (Onboarding & Dashboard)
* **Formulaire d'Inscription Complet** : Soumission du profil avec nom, téléphone, PIN secret, type de transport (Moto, Tricycle, Voiture), photos d'identité (CNI Recto/Verso, Selfie) avec prévisualisation dynamique.
* **Localisation GPS double mode** : Enregistrement des coordonnées GPS par géolocalisation automatique ou par positionnement manuel via un repère déplaçable sur une mini-carte interactive.
* **Sélection de Secteur Manuelle** : Menu déroulant et liste interactive des quartiers d'activité (Ouaga/Bobo) pour assurer un référencement précis.
* **Tableau de Bord Livreur** :
  * Indicateur d'état en ligne ("🟢 En ligne").
  * **Actualisation GPS en direct** : Bouton d'actualisation rapide des coordonnées GPS en un clic depuis son smartphone.
  * Statut de l'abonnement : Gratuit pour les 4 premiers contacts, puis nécessite un abonnement de 500 FCFA / 7 jours pour rester visible.
  * Compteur en temps réel des clics de profil et des coordonnées débloquées.
  * Liste des avis clients reçus avec calcul de la moyenne des étoiles en temps réel.
  * Messagerie intégrée pour répondre aux clients.
  * Bouton de simulation de contact pour tester la mise en veille du profil en cas de non-paiement.

### C. Espace Administrateur
* **Tableau de bord statistique** : Suivi des gains totaux (revenu simulé), du nombre de déblocages, du total de livreurs inscrits et du nombre de messages envoyés.
* **Inspecteur de messagerie** : Capacité pour les administrateurs de l'application de surveiller les conversations ouvertes en cas de litige.

---

## 📂 5. Structure des Fichiers du Projet

```text
Livraison Rapide OUAGA et BOBO/
│
├── .env.local                    # Variables d'environnement locales (URL et clé Supabase)
├── .gitignore                    # Liste des fichiers ignorés par Git (inclut .env.local)
├── index.html                    # Structure HTML principale de l'application (Monopage / SPA)
├── style.css                     # Feuille de style globale (3400+ lignes, Design System Savannah Glass)
├── app.js                        # Fichier JS principal (Logique SPA, gestion de carte, RLS, Simulation)
├── page.tsx                      # Composant Next.js d'exemple
├── package.json                  # Dépendances NPM (@supabase/ssr, @supabase/supabase-js)
├── supabase_delivery_schema.sql  # Schéma SQL complet (Tables, RLS, Triggers, Fonctions, RPC)
│
├── utils/                        # Utilitaires Supabase pour intégration Next.js
│   └── supabase/
│       ├── client.ts             # Initialisation du client Supabase côté navigateur
│       ├── middleware.ts         # Middleware d'actualisation de session
│       └── server.ts             # Initialisation du client Supabase côté serveur Next.js
│
└── .agents/                      # Configuration de l'agent de développement
```

---

## 🗄️ 6. Schéma de la Base de Données (PostgreSQL)

La base de données repose sur 5 tables principales interconnectées dans le schéma `public` de Supabase :

1. **`clients_livraison`** : Profils clients. Liés à la table `auth.users`.
2. **`livreurs`** : Profils des livreurs. Contient les coordonnées (`lat`, `lng`), les compteurs de clics et le statut.
3. **`deblocages`** : Table de liaison unique reliant un `client_id` à un `rider_id`.
4. **`avis`** : Revues clients liées à un livreur avec contrainte unique par couple `(client_id, rider_id)`.
5. **`chats_livraison`** : Historique des messages de clavardage en temps réel entre clients et livreurs.

---

## 🧠 7. Directives pour un Futur Modèle d'IA (Consignes de maintenance)

Lorsqu'un futur modèle IA travaillera sur ce projet, il **doit impérativement** suivre ces directives de développement :

### A. Sécurité de la Base de Données (RLS & Droits)
1. **Ne jamais bypasser RLS** : Toutes les tables ont la sécurité `ROW LEVEL SECURITY` activée. Ne modifiez jamais les tables de profil directement de manière non sécurisée.
2. **Le masquage du téléphone s'effectue en SQL** : Le numéro de téléphone des livreurs ne doit jamais être envoyé brut au client non premium. C'est la vue sécurisée `public.livreurs_view` qui calcule dynamiquement le masquage (`phone_display`) et l'état de déverrouillage (`is_unlocked`) côté Postgres :
   * Ne tentez jamais d'extraire la colonne brute `phone` de la table `livreurs` depuis le client JS public. Utilisez uniquement la table `livreurs_view`.
3. **Trigger de synchronisation des profils (`on_auth_user_created`)** : La création d'utilisateur dans `auth.users` synchronise automatiquement les profils via la fonction `handle_new_user()`.
4. **Fonctions en `SECURITY DEFINER`** :
   * La fonction RPC `simulate_payment_unlock()` s'exécute en mode privilégié pour insérer des déblocages pour les utilisateurs gratuits, mais elle révoque `EXECUTE` pour `PUBLIC` et ne l'accorde qu'au rôle `authenticated`. Gardez ce protocole de sécurité strict.

### B. Bonnes Pratiques CSS & HTML
1. **Respecter le Design System** : Tout nouveau composant doit utiliser les variables CSS déclarées dans `:root` de `style.css`. N'utilisez pas de valeurs brutes de couleurs en dur.
2. **Effet Glassmorphism** : Pour tout nouveau tiroir ou boîte de dialogue, appliquez :
   ```css
   background: rgba(255, 255, 255, 0.45) !important;
   border: 1px solid rgba(255, 255, 255, 0.55) !important;
   backdrop-filter: blur(35px) saturate(180%) !important;
   -webkit-backdrop-filter: blur(35px) saturate(180%) !important;
   box-shadow: 0 24px 70px rgba(54, 42, 33, 0.12), inset 0 1px 2.5px rgba(255, 255, 255, 0.95) !important;
   ```
3. **Intégrité de l'En-tête Responsive** : Ne modifiez pas la structure responsive de l'en-tête qui préserve l'affichage de la marque à l'aide de redimensionnements progressifs (de `width: 34px` à `width: 28px` pour le logo et de `0.98rem` à `0.82rem` pour le texte) sans tester l'affichage sur des viewports très étroits (320px).
4. **Utilisation des Icônes Vectorielles (SVG)** : N'utilisez jamais d'émojis bruts dans les pop-ups système. Utilisez le système de toast personnalisé qui injecte des balises SVG colorées cohérentes (styles de `stroke-width`, `stroke` et dimensions uniformes).

### C. Bonnes Pratiques JS
1. **Persistance des Sessions** : L'état applicatif dans `app.js` est synchronisé au chargement via `supabase.auth.getSession()` et la fonction `checkActiveSession()`. Tout nouvel ajout de route ou d'espace utilisateur doit s'y raccorder pour préserver la persistance.
2. **Variables d'environnement** : Ne mettez jamais la clé secrète `service_role` dans le code client ou dans `.env.local` sous un préfixe public. Seule la clé `anon` (publishable key) de Supabase doit être exposée sous `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
