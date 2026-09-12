import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslintPluginPrettier,
  {
    // Os testes mockam next/image com um <img> cru (é o jeito de renderizar
    // o componente em jsdom). A regra existe por causa de LCP e banda no
    // navegador real — num mock de teste ela só produz ruído.
    files: ["**/*.test.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  { ignores: [".next/**", "public/fotos/**"] },
];

export default eslintConfig;
