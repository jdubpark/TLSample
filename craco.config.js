module.exports = {
  style: {
    postcss: {
      plugins: [
        // eslint-disable-next-line global-require,import/no-extraneous-dependencies
        require('tailwindcss'),
        // eslint-disable-next-line global-require,import/no-extraneous-dependencies
        require('autoprefixer'),
      ],
    },
  },
}
