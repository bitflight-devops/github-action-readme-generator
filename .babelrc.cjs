module.exports = {
  sourceMaps: 'inline',
  presets: [
    [
      '@babel/preset-env',
      {
        targets: 'node 16.20',
      },
    ],
  ],
  plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
};
