import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintPluginPrettier,
  { ignores: [".next/**", "public/fotos/**"] },
];
