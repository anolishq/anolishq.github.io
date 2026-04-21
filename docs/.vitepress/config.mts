import { defineConfig } from 'vitepress'
import { readdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const DOCS = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

// ── Sidebar builder ────────────────────────────────────────────────────────

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

function label(name: string): string {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function walk(dir: string, base: string): SidebarItem[] {
  if (!existsSync(dir)) return []

  const INDEX = new Set(['index.md', 'README.md'])
  const entries = readdirSync(dir, { withFileTypes: true })

  const files = entries
    .filter(e => e.isFile() && e.name.endsWith('.md') && !INDEX.has(e.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  const subdirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name))

  const items: SidebarItem[] = []

  for (const f of files) {
    const slug = f.name.slice(0, -3)
    items.push({ text: label(slug), link: `${base}/${slug}` })
  }

  for (const d of subdirs) {
    const children = walk(join(dir, d.name), `${base}/${d.name}`)
    if (children.length) {
      items.push({ text: label(d.name), items: children, collapsed: true })
    }
  }

  return items
}

/** One sidebar entry per repo, keyed by route prefix. */
function reposSidebar(): Record<string, SidebarItem[]> {
  const reposDir = join(DOCS, 'repos')
  if (!existsSync(reposDir)) return {}

  const result: Record<string, SidebarItem[]> = {}

  const repos = readdirSync(reposDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const repo of repos) {
    const items = walk(join(reposDir, repo.name), `/repos/${repo.name}`)
    result[`/repos/${repo.name}/`] = [{
      text: repo.name,
      link: `/repos/${repo.name}/`,
      items
    }]
  }

  return result
}

/** Single-section sidebar for architecture, guides, reference. */
function sectionSidebar(name: string, title: string): Record<string, SidebarItem[]> {
  const items = walk(join(DOCS, name), `/${name}`)
  if (!items.length) return {}
  return { [`/${name}/`]: [{ text: title, link: `/${name}/`, items }] }
}

// ── Config ─────────────────────────────────────────────────────────────────

export default defineConfig({
  title: "Anolis Docs",
  description: "Unified documentation for the anolishq org.",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  // Keep dead-link checking strict. CI runs generation before VitePress build.
  ignoreDeadLinks: false,

  themeConfig: {
    logo: '/assets/brand/anolis-logo-512.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Guides', link: '/guides/' },
      { text: 'Repos', link: '/repos/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Metrics', link: '/metrics' }
    ],

    sidebar: {
      ...sectionSidebar('architecture', 'Architecture'),
      ...sectionSidebar('guides', 'Guides'),
      ...sectionSidebar('reference', 'Reference'),
      ...reposSidebar(),
    },

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/anolishq' }
    ]
  }
})
