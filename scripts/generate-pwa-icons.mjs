// Génère le jeu d'icônes PNG pour les stores (PWA / TWA Android / Apple).
// Source : public/delivery_logo_premium.jpg
// Sortie  : public/icons/icon-*.png + public/apple-touch-icon.png
//
// Utilise `sharp` (déjà fourni par Next.js). Lancer : node scripts/generate-pwa-icons.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'public', 'delivery_logo_premium.jpg');
const OUT = path.join(root, 'public', 'icons');

// Fond crème = manifest background_color (#FAF6F2). Les icônes maskable et
// apple-touch ne doivent JAMAIS être transparentes -> on aplatit sur ce fond.
const BG = { r: 0xfa, g: 0xf6, b: 0xf2, alpha: 1 };

// ratio = part de la largeur occupée par le logo (le reste = marge de sécurité).
// 'any' : marge légère. 'maskable' : grosse marge (zone sûre ~80% d'Android).
async function icon(size, ratio, outPath) {
  const inner = Math.round(size * ratio);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .toBuffer();
  const pad = Math.round((size - inner) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, top: pad, left: pad }])
    .png()
    .toFile(outPath);
  console.log('✓', path.relative(root, outPath), `(${size}x${size})`);
}

await mkdir(OUT, { recursive: true });

// Icônes "any" (marge légère 0.92)
await icon(192, 0.92, path.join(OUT, 'icon-192.png'));
await icon(512, 0.92, path.join(OUT, 'icon-512.png'));
await icon(1024, 0.92, path.join(OUT, 'icon-1024.png')); // source haute déf (Apple)

// Icônes maskable (zone sûre : logo à 0.66 du canevas)
await icon(192, 0.66, path.join(OUT, 'icon-maskable-192.png'));
await icon(512, 0.66, path.join(OUT, 'icon-maskable-512.png'));

// Apple touch icon (écran d'accueil iOS, 180x180, jamais transparent)
await icon(180, 0.92, path.join(root, 'public', 'apple-touch-icon.png'));

console.log('\nTerminé. Icônes générées dans public/icons/ et public/apple-touch-icon.png');
