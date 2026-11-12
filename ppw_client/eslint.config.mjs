import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import prettierRecommended from "eslint-plugin-prettier/recommended";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  // 1. Ignorar pastas de build e dependências
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
    ],
  },

  // 2. Trazer as configurações base do Next.js usando FlatCompat
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 3. Plugin do Prettier
  prettierRecommended,

  // 4. Adicionar regras específicas de TypeScript para maior controle
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Isso ajuda o ESLint a entender o contexto do projeto para regras avançadas
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Desabilita a regra de 'any' para facilitar o seu HATEOAS e Redirects
      "@typescript-eslint/no-explicit-any": "off",

      // Desabilita avisos de 'unsafe' para quando você lida com retornos dinâmicos da API
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",

      // Organização de imports e variáveis não usadas
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Regras de boas práticas
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Garante que você trate promessas, mas sem ser restritivo demais
      "@typescript-eslint/no-floating-promises": "warn",
      "prettier/prettier": "error",
    },
  },
];

export default eslintConfig;
