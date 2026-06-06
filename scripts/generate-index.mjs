#!/usr/bin/env node
// Scans public/recipes/ for .cook files and writes index.json.
// Run: node scripts/generate-index.mjs
import { readdirSync, statSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const recipesDir = join(__dirname, '..', 'public', 'recipes')
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
  return m[1].split(',').map((t) => t.trim()).filter(Boolean)
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

function slugify(relPath) {
  return relPath
    .replace(/\.cook$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function scan(dir, base = '') {
  const entries = readdirSync(dir)
  const results = []

  for (const entry of entries) {
    if (entry === 'index.json') continue
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
