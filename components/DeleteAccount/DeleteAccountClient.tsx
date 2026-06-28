'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Status = 'loading' | 'anonymous' | 'ready' | 'deleting' | 'done' | 'error';

const box: React.CSSProperties = {
  border: '1px solid #e6ddd3',
  borderRadius: 12,
  padding: 20,
  background: '#fff',
  marginTop: 16,
};
const dangerBtn: React.CSSProperties = {
  background: '#b3261e',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 18px',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function DeleteAccountClient() {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? 'ready' : 'anonymous');
    });
  }, [supabase]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Cette action est définitive. Votre compte et toutes vos données (profil, messages, déblocages) seront supprimés. Continuer ?'
    );
    if (!confirmed) return;

    setStatus('deleting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Échec de la suppression.');
      await supabase.auth.signOut();
      setStatus('done');
      setTimeout(() => { window.location.href = '/'; }, 3500);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Une erreur est survenue.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return <div style={box}>Chargement…</div>;
  }

  if (status === 'anonymous') {
    return (
      <div style={box}>
        <p style={{ marginTop: 0 }}>
          Vous devez être <strong>connecté</strong> pour supprimer votre compte depuis cette page.
        </p>
        <p>
          Connectez-vous dans l'application, puis revenez ici. Vous pouvez aussi demander la
          suppression en écrivant à{' '}
          <a href="mailto:contact@livraisonrapide.app" style={{ color: '#8D5537' }}>
            contact@livraisonrapide.app
          </a>{' '}
          depuis l'adresse/numéro associé à votre compte.
        </p>
        <a href="/" style={{ color: '#8D5537', fontWeight: 600 }}>← Aller à la connexion</a>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div style={box}>
        <p style={{ marginTop: 0, color: '#1a7f37', fontWeight: 600 }}>
          ✓ Votre compte a été supprimé.
        </p>
        <p>Vous allez être redirigé vers l'accueil…</p>
      </div>
    );
  }

  return (
    <div style={box}>
      <p style={{ marginTop: 0 }}>
        En supprimant votre compte, les données suivantes seront <strong>définitivement</strong> effacées :
      </p>
      <ul>
        <li>Votre profil (nom, numéro de téléphone)</li>
        <li>Pour les livreurs : véhicule, position, pièces d'identité et selfie</li>
        <li>Vos messages, avis et déblocages</li>
        <li>Vos abonnements aux notifications</li>
      </ul>
      {status === 'error' && (
        <p style={{ color: '#b3261e' }}>{errorMsg}</p>
      )}
      <button
        style={{ ...dangerBtn, opacity: status === 'deleting' ? 0.6 : 1 }}
        onClick={handleDelete}
        disabled={status === 'deleting'}
      >
        {status === 'deleting' ? 'Suppression en cours…' : 'Supprimer définitivement mon compte'}
      </button>
    </div>
  );
}
