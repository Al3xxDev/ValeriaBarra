import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const source = path.join(rootDir, "public/images/logo.jpeg");

async function main() {
  const meta = await sharp(source).metadata();
  console.log(`Source image: ${source} (${meta.width}x${meta.height})`);

  // Ensure directories exist
  await fs.mkdir(path.join(rootDir, "public/brand/logo"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "public/brand/icons"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "public/brand/favicon"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "public/brand/social"), { recursive: true });

  // 1. Full logo.jpeg in WebP and PNG
  console.log("1. Generating full logo.jpeg in webp and png...");
  await sharp(source).webp({ quality: 95 }).toFile(path.join(rootDir, "public/brand/logo/logo-full.webp"));
  await sharp(source).png().toFile(path.join(rootDir, "public/brand/logo/logo-full.png"));
  await sharp(source).toFile(path.join(rootDir, "public/brand/logo/logo-official.png"));
  await sharp(source).webp({ quality: 95 }).toFile(path.join(rootDir, "public/brand/logo/logo-official.webp"));

  // 2. Square Avatar (800x800) featuring full logo.jpeg
  console.log("2. Generating square avatar with full logo.jpeg...");
  const fullLogoForSquare = await sharp(source)
    .resize(600, 734, { fit: "contain", background: { r: 247, g: 246, b: 240, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 800,
      height: 800,
      channels: 4,
      background: { r: 247, g: 246, b: 240, alpha: 1 }
    }
  })
  .composite([{ input: fullLogoForSquare, gravity: "center" }])
  .png()
  .toFile(path.join(rootDir, "public/brand/social/avatar-square.png"));

  // 3. Apple Touch Icon (180x180) featuring full logo.jpeg
  console.log("3. Generating apple-touch-icon with full logo.jpeg...");
  const fullLogoForApple = await sharp(source)
    .resize(130, 159, { fit: "contain", background: { r: 247, g: 246, b: 240, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 247, g: 246, b: 240, alpha: 1 }
    }
  })
  .composite([{ input: fullLogoForApple, gravity: "center" }])
  .png()
  .toFile(path.join(rootDir, "public/apple-touch-icon.png"));

  await sharp(path.join(rootDir, "public/apple-touch-icon.png"))
    .toFile(path.join(rootDir, "public/brand/favicon/apple-touch-icon.png"));

  // 4. PWA Icons (192 and 512) featuring full logo.jpeg
  console.log("4. Generating PWA icons with full logo.jpeg...");
  for (const size of [192, 512]) {
    const logoH = Math.round(size * 0.88);
    const logoW = Math.round(logoH * (928 / 1135));
    const fullLogoPwa = await sharp(source)
      .resize(logoW, logoH, { fit: "contain", background: { r: 247, g: 246, b: 240, alpha: 1 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 247, g: 246, b: 240, alpha: 1 }
      }
    })
    .composite([{ input: fullLogoPwa, gravity: "center" }])
    .png()
    .toFile(path.join(rootDir, `public/brand/favicon/icon-${size}.png`));
  }

  // 5. Favicon 32x32, 16x16 and favicon.ico featuring full logo.jpeg
  console.log("5. Generating favicons with full logo.jpeg...");
  const favH = 30;
  const favW = Math.round(favH * (928 / 1135));
  const fullLogoFav32 = await sharp(source)
    .resize(favW, favH, { fit: "contain", background: { r: 247, g: 246, b: 240, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: { r: 247, g: 246, b: 240, alpha: 1 }
    }
  })
  .composite([{ input: fullLogoFav32, gravity: "center" }])
  .png()
  .toFile(path.join(rootDir, "public/favicon-32.png"));

  await sharp(path.join(rootDir, "public/favicon-32.png")).toFile(path.join(rootDir, "public/favicon-32x32.png"));
  await sharp(path.join(rootDir, "public/favicon-32.png")).toFile(path.join(rootDir, "public/brand/favicon/favicon-32.png"));

  await sharp(path.join(rootDir, "public/favicon-32.png"))
    .resize(16, 16)
    .toFile(path.join(rootDir, "public/favicon-16.png"));
  await sharp(path.join(rootDir, "public/favicon-16.png")).toFile(path.join(rootDir, "public/favicon-16x16.png"));
  await sharp(path.join(rootDir, "public/favicon-16.png")).toFile(path.join(rootDir, "public/brand/favicon/favicon-16.png"));

  await sharp(path.join(rootDir, "public/favicon-32.png")).toFile(path.join(rootDir, "public/favicon.ico"));

  // 6. Favicon SVG embedding the full logo.jpeg as base64
  console.log("6. Generating favicon.svg with full logo.jpeg...");
  const fullLogoFav64 = await sharp(source)
    .resize(52, 64, { fit: "contain", background: { r: 247, g: 246, b: 240, alpha: 1 } })
    .png()
    .toBuffer();
  const fullLogoBase64 = fullLogoFav64.toString("base64");

  const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="12" fill="#f7f6f0"/>
    <image href="data:image/png;base64,${fullLogoBase64}" x="6" y="0" width="52" height="64"/>
  </svg>`.trim();

  await fs.writeFile(path.join(rootDir, "public/favicon.svg"), svgFavicon, "utf-8");
  await fs.writeFile(path.join(rootDir, "public/brand/favicon/favicon.svg"), svgFavicon, "utf-8");
  await fs.writeFile(path.join(rootDir, "src/app/icon.svg"), svgFavicon, "utf-8");

  // 7. OpenGraph Social Share Card (1200 x 630) featuring full logo.jpeg in its entirety
  console.log("7. Generating OpenGraph card (1200x630) with full logo.jpeg...");
  const ogLogoH = 490;
  const ogLogoW = Math.round(ogLogoH * (928 / 1135));
  const fullLogoForOg = await sharp(source)
    .resize(ogLogoW, ogLogoH, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const ogCardSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#f7f6f0"/>
    <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#dce3d8" stroke-width="1.5"/>
    <rect x="36" y="36" width="1128" height="558" fill="none" stroke="#eaeee7" stroke-width="1"/>

    <!-- Left side card framing the full logo -->
    <rect x="75" y="65" width="${ogLogoW + 40}" height="${ogLogoH + 35}" rx="6" fill="#ffffff" stroke="#e0e4dc" stroke-width="1"/>

    <!-- Right side typography -->
    <g transform="translate(${75 + ogLogoW + 80}, 165)">
      <text x="0" y="0" font-family="serif, Georgia" font-size="14" font-weight="600" letter-spacing="3" fill="#89533f" text-transform="uppercase">STUDIO PROFESSIONALE · SALERNO</text>
      
      <text x="0" y="65" font-family="serif, Georgia" font-size="50" font-weight="400" letter-spacing="-1" fill="#22392e">Dott.ssa Valeria Barra</text>
      
      <text x="0" y="112" font-family="sans-serif, system-ui" font-size="20" font-weight="600" letter-spacing="3" fill="#536156" text-transform="uppercase">BIOLOGA NUTRIZIONISTA</text>
      <text x="0" y="142" font-family="sans-serif, system-ui" font-size="16" font-weight="400" letter-spacing="1" fill="#6d7a6e">Laureata in Farmacia</text>

      <line x1="0" y1="180" x2="160" y2="180" stroke="#bd775d" stroke-width="2"/>

      <text x="0" y="230" font-family="serif, Georgia" font-size="24" font-style="italic" fill="#304d3f">"Eat well, you live better"</text>

      <text x="0" y="280" font-family="sans-serif, system-ui" font-size="17" fill="#536156">Percorsi nutrizionali costruiti con ascolto,</text>
      <text x="0" y="307" font-family="sans-serif, system-ui" font-size="17" fill="#536156">competenze scientifiche e attenzione alla vita reale.</text>
    </g>
  </svg>`;

  const ogCardBase = await sharp(Buffer.from(ogCardSvg)).png().toBuffer();
  await sharp(ogCardBase)
    .composite([{ input: fullLogoForOg, left: 95, top: 82 }])
    .png()
    .toFile(path.join(rootDir, "public/og-image.png"));

  await sharp(path.join(rootDir, "public/og-image.png"))
    .toFile(path.join(rootDir, "public/brand/social/og-image.png"));

  console.log("All brand assets generated using full logo.jpeg!");
}

main().catch(console.error);
