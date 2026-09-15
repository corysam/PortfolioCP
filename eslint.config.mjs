// eslint-config-next 16 expose directement des configs "flat" :
// plus besoin du shim FlatCompat / @eslint/eslintrc.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"] },
];

export default eslintConfig;
