module.exports = {
  sourceMaps: 'inline',
  presets: [
    [
      '@babel/preset-env',
      {
        targets: 'current',
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
};
