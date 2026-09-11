import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface UploadResult {
  publicId: string;
  width: number;
  height: number;
}

/**
 * Assinatura sha1 dos parâmetros (ordenados, key=value&…) + api_secret —
 * algoritmo exigido pelo Cloudinary pra upload assinado (docs:
 * "Generating authentication signatures").
 */
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(base + apiSecret)
    .digest("hex");
}

/**
 * Sobe um arquivo local pro Cloudinary via upload assinado — sem preset
 * unsigned, porque este script roda local com acesso à API secret
 * (diferente do upload direto do browser que o admin vai fazer, planos
 * 6-10, que precisa de preset unsigned por não ter a secret disponível).
 */
export async function uploadImage(
  filePath: string,
  publicId: string,
  credentials: CloudinaryCredentials,
): Promise<UploadResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp }, credentials.apiSecret);

  const form = new FormData();
  form.append("file", new Blob([await readFile(filePath)]));
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", credentials.apiKey);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Upload falhou (HTTP ${res.status}) para ${publicId}`);
  }
  return { publicId: json.public_id, width: json.width, height: json.height };
}
