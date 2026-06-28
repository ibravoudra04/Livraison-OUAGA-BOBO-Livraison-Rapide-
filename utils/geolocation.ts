// Helper de géolocalisation robuste, partagé par les boutons "Recherche
// automatique" et "Ma position".
//
// Points clés :
// - getCurrentPosition est appelé SYNCHRONIQUEMENT dès l'invocation (l'exécuteur
//   de la Promise s'exécute immédiatement) : il faut donc appeler getUserPosition()
//   directement dans le gestionnaire de clic, sans `await` avant. iOS/Safari exige
//   que l'appel se fasse pendant le "geste utilisateur", sinon il refuse (code 1).
// - Détection du contexte non sécurisé (http) : cause fréquente de refus en test.
// - Messages d'erreur précis et actionnables (réautorisation iOS / Android).

export interface GeoResult {
  ok: boolean;
  lat?: number;
  lng?: number;
  code?: number;
  message?: string;
}

export function getUserPosition(): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, message: "La géolocalisation n'est pas supportée par ce navigateur." });
      return;
    }

    // Contexte non sécurisé (ex. test via http://192.168.x.x) → la géoloc est bloquée.
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      resolve({
        ok: false,
        message: "Connexion non sécurisée : ouvrez le site en https:// pour activer la localisation.",
      });
      return;
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);

    const handleError = (err: GeolocationPositionError, wasHighAccuracy: boolean, retry: () => void) => {
      // Délai dépassé en haute précision → on retente en basse précision
      // (la permission est déjà accordée à ce stade, pas de nouvelle popup).
      if (err.code === 3 && wasHighAccuracy) {
        retry();
        return;
      }

      let message = "Localisation impossible pour le moment.";
      if (err.code === 1) {
        message = isIOS
          ? "Permission refusée. Sur iPhone : Réglages → Confidentialité et sécurité → Service de localisation (activé), puis Réglages → Safari → Localisation → « Demander » ou « Autoriser ». Si aucune fenêtre n'apparaît, videz les données du site (Réglages → Safari → Effacer historique et données), puis réessayez."
          : "Permission refusée. Touchez le cadenas/⋮ dans la barre d'adresse → Autorisations → Localisation → Autoriser, puis réessayez.";
      } else if (err.code === 2) {
        message = "Position introuvable (signal GPS faible). Réessayez, de préférence à l'extérieur.";
      } else if (err.code === 3) {
        message = "Délai d'attente dépassé. Vérifiez votre GPS/connexion et réessayez.";
      }
      resolve({ ok: false, code: err.code, message });
    };

    const attempt = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => handleError(err, highAccuracy, () => attempt(false)),
        { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 60000 }
      );
    };

    attempt(true);
  });
}
