import Link from 'next/link';
import DeleteAccountClient from '@/components/DeleteAccount/DeleteAccountClient';

export const metadata = {
  title: 'Suppression de compte — Livraison Rapide',
  description:
    "Supprimez votre compte Livraison Rapide et toutes les données associées, directement depuis l'application.",
};

const page: React.CSSProperties = {
  maxWidth: 680,
  margin: '0 auto',
  padding: '32px 20px 80px',
  color: '#2b2118',
  lineHeight: 1.65,
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
};
const h1: React.CSSProperties = { color: '#8D5537', fontSize: 28, marginBottom: 8 };

export default function SuppressionComptePage() {
  return (
    <main style={page}>
      <p>
        <Link href="/" style={{ color: '#8D5537' }}>← Retour à l'application</Link>
      </p>
      <h1 style={h1}>Suppression de compte</h1>
      <p>
        Vous pouvez supprimer votre compte <strong>Livraison Rapide</strong> et l'ensemble des
        données personnelles associées. Cette opération est <strong>définitive et irréversible</strong>.
      </p>
      <DeleteAccountClient />
      <p style={{ marginTop: 24, fontSize: 14, color: '#6b5d4f' }}>
        Pour en savoir plus sur le traitement de vos données, consultez notre{' '}
        <Link href="/confidentialite" style={{ color: '#8D5537' }}>
          politique de confidentialité
        </Link>
        .
      </p>
    </main>
  );
}
