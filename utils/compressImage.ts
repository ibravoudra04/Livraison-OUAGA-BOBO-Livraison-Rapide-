// Compresse une photo avant upload : les photos de téléphone font 4-8 Mo,
// ce qui rend l'envoi interminable (voire impossible) sur les réseaux mobiles lents.
// Résultat : JPEG ~150-300 Ko, largement suffisant pour vérifier une CNI ou un selfie.

async function loadDrawable(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        // continue vers le fallback <img>
      }
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

export async function compressImage(file: File, maxDim = 1280, quality = 0.75): Promise<Blob> {
  try {
    const source = await loadDrawable(file);
    const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
    if (!width || !height) return file;

    const scale = Math.min(1, maxDim / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    if ('close' in source) source.close();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size === 0) return file;
    return blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

// Compresse spécifiquement le selfie de profil d'un livreur pour la carte :
// dimension max 300px, JPEG à 65% de qualité (~15-30 Ko max par photo).
// Cela empêche la carte de consommer trop de mémoire et d'avoir des ralentissements.
export async function compressSelfieForMap(file: File): Promise<File> {
  const blob = await compressImage(file, 300, 0.65);
  if (blob instanceof File) return blob;
  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
}

