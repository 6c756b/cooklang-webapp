import { CooklangParser, getFlatIngredients, type FlatIngredient } from '@cooklang/cooklang'
import type { Section, Content, Step, Item, Ingredient, Cookware, Timer } from '@cooklang/cooklang'

export type { FlatIngredient, Section, Content, Step, Item, Ingredient, Cookware, Timer }

// CooklangParser is the high-level wrapper around the WASM Parser
const parser = new CooklangParser()

export interface ParsedRecipe {
  title: string | undefined
  description: string | undefined
  servings: string | undefined
  time: string | undefined
  nutrition: string | undefined
  tags: string[]
  sections: Section[]
  ingredients: Ingredient[]
  cookware: Cookware[]
  timers: Timer[]
  flatIngredients: FlatIngredient[]
  rawMetadata: Map<unknown, unknown>
}

type RecipeTime = number | { prep_time?: number; cook_time?: number }

function formatMinutes(min: number): string {
  if (min < 60) return `${min} Min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} Std ${m} Min` : `${h} Std`
}

function formatTime(t: RecipeTime | undefined | null): string | undefined {
  if (t == null) return undefined
  if (typeof t === 'number') return formatMinutes(t)
  const parts: string[] = []
  if (t.prep_time) parts.push(`Vorbereitung: ${formatMinutes(t.prep_time)}`)
  if (t.cook_time) parts.push(`Kochen: ${formatMinutes(t.cook_time)}`)
  return parts.length ? parts.join(', ') : undefined
}

/**
 * Handle files that wrap Cooklang >> metadata inside --- delimiters (Obsidian style).
 * Two cases:
 *   1. Block contains >> lines → it's Cooklang metadata, strip --- and pass through to parser
 *   2. Block is pure YAML → parse key:value and strip it (YAML frontmatter for title/tags/etc.)
 */
function extractFrontmatter(text: string): { meta: Record<string, unknown>; body: string } {
  if (!text.trimStart().startsWith('---')) return { meta: {}, body: text }

  const firstNewline = text.indexOf('\n')
  const end = text.indexOf('\n---', firstNewline + 1)
  if (end === -1) return { meta: {}, body: text }

  const block = text.slice(firstNewline + 1, end).trim()
  const after = text.slice(end + 4).trimStart()

  // If any line in the block is a Cooklang >> metadata line, pass the block
  // through to the Cooklang parser directly (strip only the --- markers).
  if (block.split('\n').some((l) => l.trimStart().startsWith('>>'))) {
    return { meta: {}, body: block + '\n\n' + after }
  }

  // Pure YAML frontmatter — parse simple key: value and inline arrays
  const meta: Record<string, unknown> = {}
  for (const line of block.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const rawVal = line.slice(colonIdx + 1).trim()
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      meta[key] = rawVal
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else {
      meta[key] = rawVal
    }
  }

  return { meta, body: after }
}

export function parseRecipe(raw: string, scale?: number): ParsedRecipe {
  const { meta, body } = extractFrontmatter(raw)
  const [recipe] = parser.parse(body, scale ?? null)

  const flatIngredients = getFlatIngredients(recipe)

  // Prefer structured fields from parser, fall back to YAML frontmatter
  const servings =
    recipe.servings != null
      ? String(recipe.servings)
      : (meta['servings'] as string | undefined)

  const time = formatTime(recipe.time) ?? (meta['time'] as string | undefined)

  const title = recipe.title ?? (meta['title'] as string | undefined)
  const description = recipe.description ?? (meta['description'] as string | undefined)

  let tags: string[] = []
  if (recipe.tags.size > 0) {
    tags = [...recipe.tags]
  } else if (Array.isArray(meta['tags'])) {
    tags = meta['tags'] as string[]
  } else if (typeof meta['tags'] === 'string' && meta['tags']) {
    tags = (meta['tags'] as string).split(',').map((t) => t.trim()).filter(Boolean)
  }

  const nutrition = meta['nutrition'] as string | undefined

  return {
    title,
    description,
    servings,
    time,
    nutrition,
    tags,
    sections: recipe.sections,
    ingredients: recipe.ingredients,
    cookware: recipe.cookware,
    timers: recipe.timers,
    flatIngredients,
    rawMetadata: recipe.rawMetadata,
  }
}
