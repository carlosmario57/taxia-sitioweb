module.exports = {
  plugins: {
    // Cambiamos 'tailwindcss' a require('@tailwindcss/postcss')
    // Esto le dice a PostCSS que use el plugin de Tailwind CSS de la nueva manera.
    '@tailwindcss/postcss': {}, 
    autoprefixer: {},
  },
}