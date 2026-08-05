import { mkdir, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";

const SOURCE_ROOT = join(process.cwd(), "..", "data");
const OUTPUT_ROOT = join(process.cwd(), "public", "fotos");
const MANIFEST_DIR = join(process.cwd(), "src", "actions", "_mock");
const MANIFEST_PATH = join(MANIFEST_DIR, "photos.json");
const MAX_WIDTH = 1600;

const CATEGORY_DIRS: Record<string, string> = {
  profissional: "profissional",
  corporativo: "corporativo",
  pessoal: "pessoal",
  gestante: "gestante",
  familia: "familia",
  "evento-aniversario": "evento e aniversario",
  "casamento-civil": "casamento civil e pos cerimonia civil",
  comercial: "comercial",
  "making-of-noiva": "making off da noiva",
};

interface ManifestPhoto {
  slug: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
}

async function blurDataURLFor(buffer: Buffer): Promise<string> {
  const tiny = await sharp(buffer).resize(16).toFormat("webp").toBuffer();
  return `data:image/webp;base64,${tiny.toString("base64")}`;
}

async function processCategory(categorySlug: string, sourceDir: string): Promise<ManifestPhoto[]> {
  const absoluteSourceDir = join(SOURCE_ROOT, sourceDir);
  const files = (await readdir(absoluteSourceDir))
    .filter((f) => [".jpg", ".jpeg"].includes(extname(f).toLowerCase()))
    .sort();

  const outDir = join(OUTPUT_ROOT, categorySlug);
  await mkdir(outDir, { recursive: true });

  const photos: ManifestPhoto[] = [];
  for (const [i, file] of files.entries()) {
    const num = String(i + 1).padStart(2, "0");
    const slug = `${categorySlug}-${num}`;
    const base = sharp(join(absoluteSourceDir, file))
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true });

    const webpBuffer = await base.clone().toFormat("webp", { quality: 78 }).toBuffer();
    await base
      .clone()
      .toFormat("avif", { quality: 55 })
      .toFile(join(outDir, `${slug}.avif`));
    await writeFile(join(outDir, `${slug}.webp`), webpBuffer);

    const { width, height } = await sharp(webpBuffer).metadata();

    photos.push({
      slug,
      src: `/fotos/${categorySlug}/${slug}.webp`,
      width: width ?? MAX_WIDTH,
      height: height ?? MAX_WIDTH,
      blurDataURL: await blurDataURLFor(webpBuffer),
    });
  }
  return photos;
}

async function main() {
  const manifest: Record<string, ManifestPhoto[]> = {};
  for (const [categorySlug, sourceDir] of Object.entries(CATEGORY_DIRS)) {
    manifest[categorySlug] = await processCategory(categorySlug, sourceDir);
    console.log(`${categorySlug}: ${manifest[categorySlug].length} fotos`);
  }
  await mkdir(MANIFEST_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Manifesto escrito em ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
