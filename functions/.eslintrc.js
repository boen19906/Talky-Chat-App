/* eslint-env node */
export default {
    root: true,
    env: {
      es2022: true,
      node: true,
    },
    extends: ["eslint:recommended", "google"],
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // <-- Enable ES Modules
    },
    rules: {
      "quotes": ["error", "double"],
    },
  };