#!/usr/bin/env node
// Scans recipes/ for .cook files and writes recipes/index.json.
// Run: node generate-index.mjs  (from repo root, next to the recipes/ folder)
// Or:  node scripts/generate-index.mjs  (from the app repo, scans public/recipes/)
import { readdirSync, statSync, writeFileSync, existsSync, readFileSync, renameSync } from 'fs'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
// When placed in the app repo under scripts/, recipes live in ../public/recipes/
// When placed in the recipes repo root, recipes live in ./recipes/
const inAppRepo = __dirname.endsWith('scripts/')
const recipesDir = inAppRepo
  ? join(__dirname, '..', 'public', 'recipes')
  : join(__dirname, 'recipes')
const outputFile = join(recipesDir, 'index.json')

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

function titleFromFilename(filename) {
  return basename(filename, '.cook')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
}

/** Extract >> tags: ... from a .cook file (handles ---...--- wrapped blocks too). */
function extractTags(filePath, text) {
  if (!text) text = readFileSync(filePath, 'utf8')
  // Unwrap --- blocks that contain >> metadata
  let body = text
  if (text.trimStart().startsWith('---')) {
    const firstNl = text.indexOf('\n')
    const end = text.indexOf('\n---', firstNl + 1)
    if (end !== -1) body = text.slice(firstNl + 1, end)
  }
  const m = body.match(/^(?:>>)?\s*tags\s*:\s*(.+)$/im)
  if (!m) return []
  const raw = m[1].trim()
  const inner = raw.startsWith('[') && raw.endsWith(']') ? raw.slice(1, -1) : raw
  return inner.split(',').map((t) => t.trim()).filter(Boolean)
}

/** Extract >> title: or YAML title: from a .cook file. */
function extractTitle(filePath, text) {
  let body = text
  if (text.trimStart().startsWith('---')) {
    const firstNl = text.indexOf('\n')
    const end = text.indexOf('\n---', firstNl + 1)
    if (end !== -1) body = text.slice(firstNl + 1, end)
  }
  const m = body.match(/^(?:>>)?\s*title\s*:\s*(.+)$/im)
  return m ? m[1].trim() : null
}

function sanitizeName(name) {
  return name
    .normalize('NFC')
    .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
    .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
    .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
}

function slugify(relPath) {
  return relPath
    .replace(/\.cook$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function scan(dir, base = '') {
  const entries = readdirSync(dir)
  const results = []

  for (let entry of entries) {
    if (entry === 'index.json') continue

    const sanitized = sanitizeName(entry)
    if (sanitized !== entry) {
      renameSync(join(dir, entry), join(dir, sanitized))
      console.log(`  renamed: ${entry} → ${sanitized}`)
      entry = sanitized
    }

    const fullPath = join(dir, entry)
    const relPath = base ? `${base}/${entry}` : entry
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      results.push(...scan(fullPath, relPath))
    } else if (extname(entry) === '.cook') {
      const slug = slugify(relPath)
      const category = base || null
      const stem = basename(entry, '.cook')

      const text = readFileSync(fullPath, 'utf8')
      const title = extractTitle(fullPath, text) ?? titleFromFilename(entry)
      const tags = extractTags(fullPath, text)

      // Look for a sibling image with the same stem
      let image = null
      for (const ext of IMAGE_EXTS) {
        const imgPath = join(dir, stem + ext)
        if (existsSync(imgPath)) {
          image = base ? `${base}/${stem}${ext}` : `${stem}${ext}`
          break
        }
      }

      results.push({ slug, title, path: relPath, category, image, tags })
    }
  }

  return results
}

const recipes = scan(recipesDir)
recipes.sort((a, b) => a.title.localeCompare(b.title, 'de'))

const index = {
  generated: new Date().toISOString(),
  recipes,
}

writeFileSync(outputFile, JSON.stringify(index, null, 2))
console.log(`✓ index.json written — ${recipes.length} recipe(s) found`)
