module.exports = {
  presets: ["@vue/app"],
  resolve: {
    extensions: ['.vue'],
    alias: {
      '@': resolve('src'),
    }
  },
};
