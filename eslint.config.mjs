import globals from "globals";
import pluginJs from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config'} */
export default [
  // Apply ESLint rules to all `.js` files
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },

  // Add global variables for both browser and Node.js environments
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Use recommended ESLint rules from @eslint/js
  pluginJs.configs.recommended,

  // Integrate Prettier for formatting
  prettierConfig, // Prevents conflicts between ESLint and Prettier

  // Add custom rules and plugins
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "off", // Disable Prettier rule
      semi: ["error", "always"], // Require semicolon usage
      "no-console": "warn", // Warn about `console.log` usage
      "no-unused-vars": "warn", // Warn about unused variables
      eqeqeq: ["error", "always"], // Enforce strict equality (`===`)
    },
  },
];
