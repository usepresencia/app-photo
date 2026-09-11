import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "@/lib/config/env.server";

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// Proxy: adia getFirestore() pro primeiro uso real, não pro import do
// módulo. Evita inicializar o app do Firebase (e exigir as credenciais)
// em qualquer arquivo que só importe `db` de passagem, sem chamar nada.
export const db = new Proxy({} as Firestore, {
  get(_, prop: string | symbol) {
    return (getFirestore(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});
