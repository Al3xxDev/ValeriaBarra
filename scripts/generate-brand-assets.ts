import fs from "fs";
import path from "path";
import sharp from "sharp";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const brandDir = path.join(publicDir, "brand");
const logoDir = path.join(brandDir, "logo");
const iconsDir = path.join(brandDir, "icons");
const faviconDir = path.join(brandDir, "favicon");
const socialDir = path.join(brandDir, "social");

// Ensure directories exist
for (const dir of [brandDir, logoDir, iconsDir, faviconDir, socialDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// 1. CORE VECTOR PATH DEFINITIONS
// ---------------------------------------------------------------------------

// The canonical VB Monogram geometry (100x100 coordinate system, optically centered at 50,50)
function getMarkPath(stroke = "currentColor", strokeWidth = "5.4") {
  return `
    <g fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 20,27 L 36,73 L 52,27"/>
      <path d="M 52,27 L 52,73"/>
      <path d="M 52,27 C 67,27 76,33 76,44 C 76,48 72,50 65,50 L 52,50"/>
      <path d="M 52,50 L 68,50 C 76,50 80,53 80,62 C 80,71 72,73 52,73"/>
    </g>
  `;
}

// The circular seal geometry (120x120 coordinate system)
function getSealSvg(
  bg = "transparent",
  ringColor = "#304d3f",
  innerRingColor = "#dce3d8",
  markColor = "#304d3f",
  dotColor = "#bd775d"
) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  ${bg !== "transparent" ? `<rect width="120" height="120" rx="60" fill="${bg}"/>` : ""}
  <circle cx="60" cy="60" r="54" fill="none" stroke="${ringColor}" stroke-width="1.8"/>
  <circle cx="60" cy="60" r="49" fill="none" stroke="${innerRingColor}" stroke-width="0.8"/>
  <circle cx="60" cy="9.5" r="1.4" fill="${dotColor}"/>
  <circle cx="60" cy="110.5" r="1.4" fill="${dotColor}"/>
  <circle cx="9.5" cy="60" r="1.4" fill="${dotColor}"/>
  <circle cx="110.5" cy="60" r="1.4" fill="${dotColor}"/>
  <g transform="translate(18, 18) scale(0.84)">
    ${getMarkPath(markColor, "5.6")}
  </g>
</svg>
`.trim();
}

// ---------------------------------------------------------------------------
// 2. ICON MARKS (SVG)
// ---------------------------------------------------------------------------

// Clean standalone icon mark
const logoMarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  ${getMarkPath("#304d3f", "5.4")}
</svg>
`.trim();

const logoMarkLightSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  ${getMarkPath("#f7f6f0", "5.4")}
</svg>
`.trim();

const logoMarkMonochromeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  ${getMarkPath("#26372f", "5.4")}
</svg>
`.trim();

// Badge / Seal SVGs
const logoMarkBadgeSvg = getSealSvg("transparent", "#304d3f", "#dce3d8", "#304d3f", "#bd775d");
const logoMarkBadgeDarkSvg = getSealSvg("transparent", "#f7f6f0", "rgba(255,255,255,0.3)", "#f7f6f0", "#dce3d8");

// ---------------------------------------------------------------------------
// 3. LOGO LOCKUPS (SVG)
// ---------------------------------------------------------------------------

// Primary Horizontal Logo
const logoPrimarySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="380" height="90">
  <g transform="translate(16, 17) scale(0.56)">
    ${getMarkPath("#304d3f", "6")}
  </g>
  <line x1="84" y1="26" x2="84" y2="64" stroke="#d5dbd0" stroke-width="1"/>
  <text x="98" y="44" fill="#26372f" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="24" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
  <text x="99" y="59" fill="#536156" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="8.5" font-weight="600" letter-spacing="1.8">BIOLOGA NUTRIZIONISTA</text>
</svg>
`.trim();

// Primary Dark Horizontal Logo
const logoPrimaryDarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="380" height="90">
  <g transform="translate(16, 17) scale(0.56)">
    ${getMarkPath("#f7f6f0", "6")}
  </g>
  <line x1="84" y1="26" x2="84" y2="64" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="98" y="44" fill="#f7f6f0" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="24" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
  <text x="99" y="59" fill="#c8d2c6" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="8.5" font-weight="600" letter-spacing="1.8">BIOLOGA NUTRIZIONISTA</text>
</svg>
`.trim();

// Compact Horizontal Logo (Symbol + Name)
const logoCompactSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 70" width="270" height="70">
  <g transform="translate(12, 11) scale(0.48)">
    ${getMarkPath("#304d3f", "6.2")}
  </g>
  <line x1="72" y1="20" x2="72" y2="50" stroke="#d5dbd0" stroke-width="1"/>
  <text x="84" y="43" fill="#26372f" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="23" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
</svg>
`.trim();

const logoCompactDarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 70" width="270" height="70">
  <g transform="translate(12, 11) scale(0.48)">
    ${getMarkPath("#f7f6f0", "6.2")}
  </g>
  <line x1="72" y1="20" x2="72" y2="50" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="84" y="43" fill="#f7f6f0" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="23" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
</svg>
`.trim();

// Vertical Stacked Logo
const logoVerticalSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 190" width="240" height="190">
  <g transform="translate(85, 16) scale(0.7)">
    ${getMarkPath("#304d3f", "5.6")}
  </g>
  <line x1="90" y1="100" x2="150" y2="100" stroke="#d5dbd0" stroke-width="1"/>
  <text x="120" y="128" text-anchor="middle" fill="#26372f" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="23" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
  <text x="120" y="146" text-anchor="middle" fill="#536156" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="8" font-weight="600" letter-spacing="1.8">BIOLOGA NUTRIZIONISTA</text>
  <text x="120" y="162" text-anchor="middle" fill="#9da79c" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="7" font-weight="500" letter-spacing="1.2">SALERNO</text>
</svg>
`.trim();

const logoVerticalDarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 190" width="240" height="190">
  <g transform="translate(85, 16) scale(0.7)">
    ${getMarkPath("#f7f6f0", "5.6")}
  </g>
  <line x1="90" y1="100" x2="150" y2="100" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="120" y="128" text-anchor="middle" fill="#f7f6f0" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="23" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
  <text x="120" y="146" text-anchor="middle" fill="#c8d2c6" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="8" font-weight="600" letter-spacing="1.8">BIOLOGA NUTRIZIONISTA</text>
  <text x="120" y="162" text-anchor="middle" fill="#8c978b" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="7" font-weight="500" letter-spacing="1.2">SALERNO</text>
</svg>
`.trim();

// Monochrome Versions (100% single color)
const logoMonochromeDarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="380" height="90">
  <g transform="translate(16, 17) scale(0.56)">
    ${getMarkPath("#26372f", "6")}
  </g>
  <line x1="84" y1="26" x2="84" y2="64" stroke="#26372f" stroke-width="1"/>
  <text x="98" y="44" fill="#26372f" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="24" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
  <text x="99" y="59" fill="#26372f" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="8.5" font-weight="600" letter-spacing="1.8">BIOLOGA NUTRIZIONISTA</text>
</svg>
`.trim();

const logoMonochromeLightSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="380" height="90">
  <g transform="translate(16, 17) scale(0.56)">
    ${getMarkPath("#ffffff", "6")}
  </g>
  <line x1="84" y1="26" x2="84" y2="64" stroke="#ffffff" stroke-width="1"/>
  <text x="98" y="44" fill="#ffffff" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="24" font-weight="400" letter-spacing="-0.5">Valeria Barra</text>
  <text x="99" y="59" fill="#ffffff" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="8.5" font-weight="600" letter-spacing="1.8">BIOLOGA NUTRIZIONISTA</text>
</svg>
`.trim();

// ---------------------------------------------------------------------------
// 4. FAVICON & APP ICON (SVG)
// ---------------------------------------------------------------------------

// High contrast circular badge for browser tab (visible on both dark & light chrome)
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="#304d3f"/>
  <circle cx="32" cy="32" r="27.5" fill="none" stroke="#dce3d8" stroke-width="0.8"/>
  <g transform="translate(12.5, 12.5) scale(0.39)">
    ${getMarkPath("#f7f6f0", "7.5")}
  </g>
</svg>
`.trim();

// Apple Touch Icon SVG base (180x180)
const appleTouchSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" rx="36" fill="#304d3f"/>
  <circle cx="90" cy="90" r="74" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
  <circle cx="90" cy="90" r="68" fill="none" stroke="rgba(220,227,216,0.3)" stroke-width="0.8"/>
  <!-- Cardinal dots -->
  <circle cx="90" cy="20" r="2.2" fill="#bd775d"/>
  <circle cx="90" cy="160" r="2.2" fill="#bd775d"/>
  <circle cx="20" cy="90" r="2.2" fill="#bd775d"/>
  <circle cx="160" cy="90" r="2.2" fill="#bd775d"/>
  <g transform="translate(38, 38) scale(1.04)">
    ${getMarkPath("#f7f6f0", "5.6")}
  </g>
</svg>
`.trim();

// ---------------------------------------------------------------------------
// 5. SOCIAL & OPEN GRAPH (1200x630 & 1024x1024)
// ---------------------------------------------------------------------------

const ogImageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#f7f6f0"/>
  <!-- Decorative perimeter double border -->
  <rect x="36" y="36" width="1128" height="558" fill="none" stroke="#304d3f" stroke-width="1.8"/>
  <rect x="44" y="44" width="1112" height="542" fill="none" stroke="#dce3d8" stroke-width="0.8"/>
  <!-- Corner terracotta accents -->
  <circle cx="36" cy="36" r="3.5" fill="#bd775d"/>
  <circle cx="1164" cy="36" r="3.5" fill="#bd775d"/>
  <circle cx="36" cy="594" r="3.5" fill="#bd775d"/>
  <circle cx="1164" cy="594" r="3.5" fill="#bd775d"/>

  <!-- Left: Emblem Seal -->
  <g transform="translate(120, 195) scale(2)">
    ${getSealSvg("transparent", "#304d3f", "#dce3d8", "#304d3f", "#bd775d")}
  </g>

  <!-- Divider -->
  <line x1="420" y1="180" x2="420" y2="450" stroke="#d5dbd0" stroke-width="1.2"/>

  <!-- Right: Typography -->
  <g transform="translate(470, 0)">
    <text x="0" y="240" fill="#536156" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="16" font-weight="600" letter-spacing="3.5">STUDIO NUTRIZIONALE · SALERNO</text>
    <text x="0" y="325" fill="#26372f" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="74" font-weight="400" letter-spacing="-1.5">Valeria Barra</text>
    <text x="0" y="375" fill="#304d3f" font-family="'Avenir Next', Avenir, 'Segoe UI', sans-serif" font-size="22" font-weight="600" letter-spacing="3">BIOLOGA NUTRIZIONISTA</text>
    <text x="0" y="440" fill="#70796e" font-family="'Iowan Old Style', 'Baskerville Old Face', Georgia, serif" font-size="22" font-style="italic">Un percorso consapevole, concreto e costruito intorno alla persona.</text>
  </g>
</svg>
`.trim();

const avatarSquareSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#f7f6f0"/>
  <g transform="translate(112, 112) scale(6.666)">
    ${getSealSvg("transparent", "#304d3f", "#dce3d8", "#304d3f", "#bd775d")}
  </g>
</svg>
`.trim();

// ---------------------------------------------------------------------------
// 6. GENERATION & EXPORT ROUTINE
// ---------------------------------------------------------------------------

async function main() {
  console.log("Generating vector SVG assets...");

  // Save Icon Marks
  fs.writeFileSync(path.join(iconsDir, "logo-mark.svg"), logoMarkSvg);
  fs.writeFileSync(path.join(iconsDir, "logo-mark-light.svg"), logoMarkLightSvg);
  fs.writeFileSync(path.join(iconsDir, "logo-mark-monochrome.svg"), logoMarkMonochromeSvg);
  fs.writeFileSync(path.join(iconsDir, "logo-mark-badge.svg"), logoMarkBadgeSvg);
  fs.writeFileSync(path.join(iconsDir, "logo-mark-badge-dark.svg"), logoMarkBadgeDarkSvg);

  // Save Logos
  fs.writeFileSync(path.join(logoDir, "logo-primary.svg"), logoPrimarySvg);
  fs.writeFileSync(path.join(logoDir, "logo-primary-dark.svg"), logoPrimaryDarkSvg);
  fs.writeFileSync(path.join(logoDir, "logo-compact.svg"), logoCompactSvg);
  fs.writeFileSync(path.join(logoDir, "logo-compact-dark.svg"), logoCompactDarkSvg);
  fs.writeFileSync(path.join(logoDir, "logo-vertical.svg"), logoVerticalSvg);
  fs.writeFileSync(path.join(logoDir, "logo-vertical-dark.svg"), logoVerticalDarkSvg);
  fs.writeFileSync(path.join(logoDir, "logo-monochrome.svg"), logoMonochromeDarkSvg);
  fs.writeFileSync(path.join(logoDir, "logo-monochrome-light.svg"), logoMonochromeLightSvg);

  // Save Favicons (SVG)
  fs.writeFileSync(path.join(faviconDir, "favicon.svg"), faviconSvg);
  fs.writeFileSync(path.join(publicDir, "favicon.svg"), faviconSvg);
  fs.writeFileSync(path.join(rootDir, "src/app/icon.svg"), faviconSvg);

  console.log("Generating raster PNG and ICO assets using sharp...");

  // Favicon PNGs
  const faviconBuffer = Buffer.from(faviconSvg);
  const fav16 = await sharp(faviconBuffer).resize(16, 16).png().toBuffer();
  const fav32 = await sharp(faviconBuffer).resize(32, 32).png().toBuffer();
  const fav48 = await sharp(faviconBuffer).resize(48, 48).png().toBuffer();

  fs.writeFileSync(path.join(faviconDir, "favicon-16.png"), fav16);
  fs.writeFileSync(path.join(faviconDir, "favicon-32.png"), fav32);
  fs.writeFileSync(path.join(faviconDir, "favicon-48.png"), fav48);
  fs.writeFileSync(path.join(publicDir, "favicon-32.png"), fav32);

  // Simple clean .ico generation (valid 32x32 PNG header as modern ICO standard)
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), fav32);

  // Apple Touch Icon
  const appleBuffer = Buffer.from(appleTouchSvg);
  await sharp(appleBuffer).resize(180, 180).png().toFile(path.join(faviconDir, "apple-touch-icon.png"));
  await sharp(appleBuffer).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));

  // PWA Icons
  await sharp(appleBuffer).resize(192, 192).png().toFile(path.join(faviconDir, "icon-192.png"));
  await sharp(appleBuffer).resize(512, 512).png().toFile(path.join(faviconDir, "icon-512.png"));

  // Social Assets
  const ogBuffer = Buffer.from(ogImageSvg);
  await sharp(ogBuffer).resize(1200, 630).png().toFile(path.join(socialDir, "og-image.png"));
  await sharp(ogBuffer).resize(1200, 630).png().toFile(path.join(publicDir, "og-image.png"));

  const avatarBuffer = Buffer.from(avatarSquareSvg);
  await sharp(avatarBuffer).resize(1024, 1024).png().toFile(path.join(socialDir, "avatar-square.png"));

  console.log("All brand assets successfully generated in /public/brand/ and /public/");
}

main().catch(console.error);
