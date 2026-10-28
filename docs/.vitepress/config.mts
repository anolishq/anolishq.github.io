import { defineConfig } from 'vitepress'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const DOCS = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

// ── Sidebar ────────────────────────────────────────────────────────────────

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

// A page's sidebar label is its first H1, falling back to the file name.
function title(file: string, slug: string): string {
  const h1 = readFileSync(file, 'utf-8').match(/^#\s+(.+)$/m)
  if (h1) return h1[1].replace(/`/g, '').trim()
  return slug.replace(/[-_]/g, ' ')
}

function walk(dir: string, base: string): SidebarItem[] {
  if (!existsSync(dir)) return []

  const INDEX = new Set(['index.md', 'README.md'])
  const entries = readdirSync(dir, { withFileTypes: true })

  const files = entries
    .filter(e => e.isFile() && e.name.endsWith('.md') && !INDEX.has(e.name))
    .map(e => {
      const slug = e.name.slice(0, -3)
      return { text: title(join(dir, e.name), slug), link: `${base}/${slug}` }
    })
    .sort((a, b) => a.text.localeCompare(b.text))

  const subdirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name))

  const items: SidebarItem[] = [...files]
  for (const d of subdirs) {
    const children = walk(join(dir, d.name), `${base}/${d.name}`)
    if (children.length) {
      // A README.md index is published at .../README, an index.md at .../
      const idx = ['index.md', 'README.md'].find(n => existsSync(join(dir, d.name, n)))
      items.push({
        text: idx ? title(join(dir, d.name, idx), d.name) : d.name,
        link: idx === 'index.md' ? `${base}/${d.name}/` : idx ? `${base}/${d.name}/README` : undefined,
        items: children,
        collapsed: true,
      })
    }
  }
  return items
}

// Every aggregated repo, each as a collapsed group of its own pages.
function components(): SidebarItem[] {
  const reposDir = join(DOCS, 'repos')
  if (!existsSync(reposDir)) return []
  return readdirSync(reposDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(repo => ({
      text: repo.name,
      link: `/repos/${repo.name}/`,
      items: walk(join(reposDir, repo.name), `/repos/${repo.name}`),
      collapsed: true,
    }))
}

// One sidebar for the whole site, ordered by what a reader is trying to do.
// Each link points at the page in the repository that owns it.
const sidebar: SidebarItem[] = [
  {
    text: 'Get started',
    link: '/get-started/',
    items: [
      { text: 'Install on a machine', link: '/repos/anolis/deploy/README' },
      { text: 'Build from source', link: '/repos/anolis/getting-started' },
    ],
  },
  {
    text: 'Concepts',
    link: '/concepts/',
    items: [
      { text: 'How the parts fit', link: '/concepts/' },
      { text: 'Runtime architecture', link: '/repos/anolis/architecture' },
      { text: 'Providers', link: '/repos/anolis/providers' },
      { text: 'The provider protocol (ADPP)', link: '/repos/anolis-protocol/' },
      { text: 'Modes and automation', link: '/repos/anolis/automation' },
      { text: 'Safety and stops', link: '/repos/anolis/safety' },
    ],
  },
  {
    text: 'Guides',
    items: [
      { text: 'Deployment overview', link: '/repos/anolis/deploy/README' },
      { text: 'Deploy with install.sh', link: '/repos/anolis/deploy/install-sh' },
      { text: 'Deploy over SSH', link: '/repos/anolis/deploy/workbench-ssh' },
      { text: 'Deploy a development build', link: '/repos/anolis/deploy/developer' },
      { text: 'Configure the runtime', link: '/repos/anolis/configuration' },
      { text: 'Secure the HTTP API', link: '/repos/anolis/security' },
      { text: 'Commissioning handoff', link: '/repos/anolis-workbench/commissioning-handoff-runbook' },
      { text: 'Simulated devices', link: '/repos/anolis-provider-sim/configuration' },
      { text: 'BREAD boards', link: '/repos/anolis-provider-bread/' },
      { text: 'EZO sensors', link: '/repos/anolis-provider-ezo/' },
    ],
  },
  {
    text: 'Reference',
    link: '/reference/',
    items: [
      { text: 'HTTP API guide', link: '/repos/anolis/http-api' },
      { text: 'HTTP API (OpenAPI)', link: '/reference/runtime-http-api' },
      { text: 'Runtime configuration', link: '/repos/anolis/configuration-schema' },
      { text: 'Machine profile', link: '/repos/anolis/contracts/machine-profile-baseline' },
      { text: 'ADPP semantics', link: '/repos/anolis-protocol/semantics' },
      { text: 'ADPP messages', link: '/reference/adpp-protocol' },
      { text: 'Schemas', link: '/reference/schemas' },
    ],
  },
  {
    text: 'Components',
    link: '/repos/',
    collapsed: true,
    items: components(),
  },
  {
    text: 'Contributing',
    link: '/contributing/',
    collapsed: true,
    items: walk(join(DOCS, 'contributing'), '/contributing'),
  },
]

// ── Config ─────────────────────────────────────────────────────────────────

export default defineConfig({
  title: 'Anolis',
  description: 'Documentation for Anolis, a control runtime for machines built from many devices.',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  // Keep dead-link checking strict. CI runs generation before VitePress build.
  ignoreDeadLinks: false,

  themeConfig: {
    logo: '/assets/brand/anolis-logo-512.png',
    nav: [
      { text: 'Get started', link: '/get-started/' },
      { text: 'Concepts', link: '/concepts/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Components', link: '/repos/' },
      { text: 'Contributing', link: '/contributing/' },
    ],

    sidebar,

    footer: {
      message: '<a href="/metrics">Code metrics</a>',
    },

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/anolishq' }
    ]
  }
})
