module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'nativewind/babel',
    ['@babel/plugin-syntax-import-attributes', {deprecatedAssertSyntax: true}],
    '@babel/plugin-transform-export-namespace-from',
  ],
};
