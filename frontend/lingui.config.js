/** @type {import('@lingui/conf').LinguiConfig} */
export default {
  locales: ["en", "hi", "ml"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: "po",
  orderBy: "messageId",
  compilerBabelOptions: {
    minified: false,
    jsescOption: {
      minimal: true,
    },
  },
  compileNamespace: "es",
}