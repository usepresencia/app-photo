import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // scripts/ e a raiz entram no plano de migração pro Cloudinary/Firestore
    // — o script de migração e o loader do Cloudinary vivem fora de src/ de
    // propósito (não fazem parte do app Next em si), mas precisam de teste
    // real igual qualquer outra lógica pura do projeto.
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}", "*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
