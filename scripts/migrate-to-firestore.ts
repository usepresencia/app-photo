/**
 * Migra o acervo local (87 fotos + niche/package/profile hoje só em
 * mock) pro Cloudinary + Firestore de produção. Roda uma vez.
 *
 * Uso:
 *   tsx scripts/migrate-to-firestore.ts --dry-run   # não escreve nada, só mostra o que faria
 *   tsx scripts/migrate-to-firestore.ts             # escreve de verdade (precisa de .env.local)
 */
import { join } from "node:path";
import photosByCategory from "../src/actions/_mock/photos.json";
import { uploadImage, type CloudinaryCredentials } from "./migration/cloudinaryUpload";
import {
  deriveFotos,
  derivePlacements,
  type RawPhoto,
} from "./migration/derivePhotosAndPlacements";
import {
  collectNiches,
  collectPackages,
  collectProfile,
  collectTestimonials,
} from "./migration/migrateContent";

const DRY_RUN = process.argv.includes("--dry-run");

// process.loadEnvFile lê .env.local ANTES de qualquer import dinâmico mais
// abaixo (env.server.ts, importado só dentro de main() via import()
// dinâmico) avaliar process.env — imports estáticos deste arquivo (acima)
// não leem env em nenhum momento, então a ordem aqui é segura mesmo com
// imports de ES modules sendo hoisted.
try {
  process.loadEnvFile(".env.local");
} catch {
  if (!DRY_RUN) {
    console.error(
      "Não encontrei .env.local com as credenciais do Cloudinary/Firebase. Rode com --dry-run pra testar sem credenciais.",
    );
    process.exit(1);
  }
}

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  // Valida as duas credenciais ANTES de subir a primeira foto — sem isso, um
  // .env.local com Cloudinary ok mas Firebase incompleto deixaria o script
  // gastar upload de verdade (rede, cota) e só falhar depois, no primeiro
  // db!.collection(...).set().
  if (!DRY_RUN && !(cloudName && apiKey && apiSecret)) {
    console.error("Faltam CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET no .env.local.");
    process.exit(1);
  }
  if (!DRY_RUN && !(firebaseProjectId && firebaseClientEmail && firebasePrivateKey)) {
    console.error(
      "Faltam FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY no .env.local.",
    );
    process.exit(1);
  }
  const credentials: CloudinaryCredentials | undefined = DRY_RUN
    ? undefined
    : { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! };

  // import() dinâmico de propósito: firebase/admin.ts importa env.server.ts,
  // que lê process.env no top level do módulo. Em --dry-run, nunca
  // inicializa o Firebase Admin SDK — não precisa de credencial nenhuma.
  const db = DRY_RUN ? undefined : (await import("../src/api/infrastructure/firebase/admin")).db;

  const photos = photosByCategory as Record<string, RawPhoto[]>;
  const fotos = deriveFotos(photos);
  const placements = derivePlacements(photos);
  console.log(`${fotos.length} fotos, ${placements.length} placements derivados.\n`);

  console.log("--- Fotos (Cloudinary + photos/{id}) ---");
  for (const foto of fotos) {
    if (DRY_RUN) {
      console.log(`[dry-run] upload ${foto.id} <- public${foto.localPath}`);
      continue;
    }
    const uploaded = await uploadImage(
      join(process.cwd(), "public", foto.localPath),
      foto.id,
      credentials!,
    );
    // width/height vêm da resposta do Cloudinary, não de foto.width/height
    // (o que photos.json registrou localmente) — é o Cloudinary quem sabe as
    // dimensões reais do asset que ficou armazenado.
    const photoDoc = {
      cloudinaryPublicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      blurDataURL: foto.blurDataURL,
    };
    // Grava live + rascunho (arquitetura de rascunho/publicação, adicionada
    // depois deste script) — sem isso, o /preview do admin-photo (que lê só
    // de *_draft) fica vazio mesmo com o site live populado.
    await db!.collection("photos").doc(foto.id).set(photoDoc);
    await db!.collection("photos_draft").doc(foto.id).set(photoDoc);
    console.log(`  ${foto.id} ok`);
  }

  console.log("\n--- Placements ---");
  for (const placement of placements) {
    if (DRY_RUN) {
      console.log(
        `[dry-run] placement ${placement.surface}/${placement.refId ?? "-"} order=${placement.order} <- ${placement.photoId}`,
      );
      continue;
    }
    // ID determinístico (não .add(), que gera um ID novo a cada chamada) —
    // re-rodar o script depois de uma interrupção sobrescreve o mesmo
    // placement em vez de duplicá-lo. (surface, refId, order) já é único:
    // order não se repete dentro do mesmo par surface/refId.
    const placementId = `${placement.surface}-${placement.refId ?? "none"}-${placement.order}`;
    await db!.collection("placements").doc(placementId).set(placement);
    await db!.collection("placements_draft").doc(placementId).set(placement);
  }

  console.log("\n--- Niches ---");
  const niches = await collectNiches();
  for (const niche of niches) {
    if (DRY_RUN) {
      console.log(`[dry-run] niches/${niche.slug}`);
      continue;
    }
    const nicheDoc = {
      title: niche.title,
      subtitle: niche.subtitle,
      intro: niche.intro,
      description: niche.description,
      highlights: niche.highlights,
      closingLine: niche.closingLine,
      showAsEventTeaser: niche.showAsEventTeaser,
      order: niche.order,
      eventOrder: niche.eventOrder,
    };
    await db!.collection("niches").doc(niche.slug).set(nicheDoc);
    await db!.collection("niches_draft").doc(niche.slug).set(nicheDoc);
  }

  console.log("\n--- Packages ---");
  const packages = await collectPackages(niches);
  for (const pkg of packages) {
    if (DRY_RUN) {
      console.log(`[dry-run] packages/${pkg.id}`);
      continue;
    }
    const packageDoc = {
      nicheSlug: pkg.nicheSlug,
      name: pkg.name,
      price: pkg.price,
      description: pkg.description,
      items: pkg.items,
      featured: pkg.featured,
      order: pkg.order,
    };
    await db!.collection("packages").doc(pkg.id).set(packageDoc);
    await db!.collection("packages_draft").doc(pkg.id).set(packageDoc);
  }

  console.log("\n--- Profile ---");
  const profile = await collectProfile();
  if (DRY_RUN) {
    console.log("[dry-run] profile/main");
  } else {
    await db!.collection("profile").doc("main").set(profile);
    await db!.collection("profile_draft").doc("main").set(profile);
  }

  // Testimonials nunca foram estáticos no código (main não tinha essa
  // entidade) — os 3 depoimentos reais já usados como seed/mock em ambos
  // os repositórios (confirmados contra o texto que estava em produção).
  console.log("\n--- Testimonials ---");
  const testimonials = await collectTestimonials();
  for (const testimonial of testimonials) {
    if (DRY_RUN) {
      console.log(`[dry-run] testimonials/${testimonial.id}`);
      continue;
    }
    const { id, ...fields } = testimonial;
    await db!.collection("testimonials").doc(id).set(fields);
    await db!.collection("testimonials_draft").doc(id).set(fields);
  }

  console.log(DRY_RUN ? "\nDry-run concluído — nada foi escrito." : "\nMigração concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
