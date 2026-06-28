import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité — Livraison Rapide',
  description:
    "Comment Livraison Rapide collecte, utilise et protège vos données personnelles (clients et livreurs) à Ouagadougou et Bobo-Dioulasso.",
};

const page: React.CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  padding: '32px 20px 80px',
  color: '#2b2118',
  lineHeight: 1.65,
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
};
const h1: React.CSSProperties = { color: '#8D5537', fontSize: 28, marginBottom: 4 };
const h2: React.CSSProperties = { color: '#8D5537', fontSize: 20, marginTop: 32 };
const small: React.CSSProperties = { color: '#6b5d4f', fontSize: 14 };
const li: React.CSSProperties = { marginBottom: 6 };

export default function ConfidentialitePage() {
  return (
    <main style={page}>
      <p>
        <Link href="/" style={{ color: '#8D5537' }}>← Retour à l'application</Link>
      </p>
      <h1 style={h1}>Politique de confidentialité</h1>
      <p style={small}>Dernière mise à jour : 28 juin 2026</p>

      <p>
        La présente politique explique quelles données personnelles l'application{' '}
        <strong>Livraison Rapide</strong> (« nous ») collecte, pourquoi, comment elles sont
        utilisées et protégées, et quels sont vos droits. Le service met en relation des clients
        et des livreurs indépendants à Ouagadougou et Bobo-Dioulasso (Burkina Faso).
      </p>

      <h2 style={h2}>1. Responsable du traitement</h2>
      <p>
        Livraison Rapide — Burkina Faso.<br />
        Contact : <a href="mailto:contact@livraisonrapide.app" style={{ color: '#8D5537' }}>contact@livraisonrapide.app</a>
        {' '}— Tél./WhatsApp : +226 67 37 09 09.
      </p>

      <h2 style={h2}>2. Données que nous collectons</h2>
      <p><strong>Pour tous les utilisateurs :</strong></p>
      <ul>
        <li style={li}>Numéro de téléphone (sert d'identifiant de connexion).</li>
        <li style={li}>Nom ou pseudonyme.</li>
        <li style={li}>Position géographique (GPS), uniquement si vous l'autorisez.</li>
        <li style={li}>Messages échangés dans la messagerie intégrée (texte et images).</li>
        <li style={li}>Données techniques : type d'appareil, journaux de connexion.</li>
      </ul>
      <p><strong>Spécifiquement pour les livreurs :</strong></p>
      <ul>
        <li style={li}>Type de véhicule.</li>
        <li style={li}>Position GPS en temps réel (lorsque le partage est actif).</li>
        <li style={li}>
          Pièces d'identité : carte nationale d'identité (recto/verso) et photo selfie,
          aux fins de vérification d'identité.
        </li>
      </ul>
      <p><strong>Pour le déblocage payant :</strong></p>
      <ul>
        <li style={li}>
          Capture d'écran du reçu de paiement Mobile Money que vous transmettez, et identifiant
          de transaction associé (pour éviter les réutilisations frauduleuses).
        </li>
      </ul>

      <h2 style={h2}>3. Finalités d'utilisation</h2>
      <ul>
        <li style={li}>Afficher les livreurs disponibles sur la carte et permettre la mise en relation.</li>
        <li style={li}>Calculer la proximité entre client et livreur.</li>
        <li style={li}>Vérifier l'identité des livreurs et la légitimité des paiements.</li>
        <li style={li}>Permettre la messagerie et les avis.</li>
        <li style={li}>Envoyer des notifications (avec votre consentement).</li>
        <li style={li}>Assurer la sécurité et prévenir la fraude.</li>
      </ul>

      <h2 style={h2}>4. Partage avec des tiers</h2>
      <p>Nous ne vendons pas vos données. Elles sont traitées par des prestataires techniques :</p>
      <ul>
        <li style={li}><strong>Supabase</strong> — hébergement de la base de données, authentification et stockage sécurisé des fichiers.</li>
        <li style={li}><strong>Vercel</strong> — hébergement de l'application.</li>
        <li style={li}><strong>Google (Gemini)</strong> — lecture automatisée (OCR) des captures d'écran de reçus de paiement uniquement.</li>
        <li style={li}>Service de notifications push (Web Push) pour l'envoi des alertes.</li>
      </ul>

      <h2 style={h2}>5. Visibilité publique</h2>
      <p>
        La position et le profil des livreurs <strong>actifs</strong> sont visibles publiquement
        sur la carte. Le numéro de téléphone d'un livreur reste <strong>masqué</strong> tant qu'il
        n'a pas été débloqué selon les conditions du service. Les pièces d'identité (CNI, selfie)
        ne sont <strong>jamais</strong> rendues publiques ; elles sont accessibles uniquement à
        l'administration à des fins de vérification.
      </p>

      <h2 style={h2}>6. Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. Elles sont supprimées
        lorsque vous supprimez votre compte (voir section 8), sous réserve des obligations
        légales de conservation éventuelles.
      </p>

      <h2 style={h2}>7. Sécurité</h2>
      <p>
        Les mots de passe/codes PIN sont stockés sous forme chiffrée (hachage). Les communications
        se font en HTTPS. L'accès aux données est restreint par des règles de sécurité au niveau
        de la base de données.
      </p>

      <h2 style={h2}>8. Vos droits</h2>
      <p>
        Vous pouvez demander l'accès, la rectification ou la suppression de vos données, et vous
        opposer à certains traitements. Vous pouvez <strong>supprimer vous-même votre compte</strong> et
        les données associées depuis la page{' '}
        <Link href="/suppression-compte" style={{ color: '#8D5537', fontWeight: 600 }}>
          Suppression de compte
        </Link>
        , ou en nous écrivant à{' '}
        <a href="mailto:contact@livraisonrapide.app" style={{ color: '#8D5537' }}>contact@livraisonrapide.app</a>.
      </p>

      <h2 style={h2}>9. Notifications & stockage local</h2>
      <p>
        L'application utilise le stockage local du navigateur et des cookies techniques pour
        maintenir votre session connectée. Les notifications push ne sont envoyées qu'après votre
        consentement explicite ; vous pouvez les désactiver à tout moment dans les réglages de
        votre appareil.
      </p>

      <h2 style={h2}>10. Mineurs</h2>
      <p>
        Le service n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons pas
        sciemment de données concernant des mineurs.
      </p>

      <h2 style={h2}>11. Modifications</h2>
      <p>
        Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de
        page. Les changements importants vous seront signalés dans l'application.
      </p>
    </main>
  );
}
