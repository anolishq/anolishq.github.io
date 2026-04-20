import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Anolis Docs",
  description: "Unified documentation for the anolishq org.",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Guides', link: '/guides/' },
      { text: 'Repos', link: '/repos/' },
      { text: 'Reference', link: '/reference/' }
    ],

    sidebar: {},

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/anolishq' }
    ]
  }
})
