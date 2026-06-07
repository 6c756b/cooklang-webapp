import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { recipeUrl } from '../lib/cooklang'
import type { RecipeEntry } from '../types/recipe'

// currentPath = ["Home", "Pork"] means we're inside Zu Home/Pork
type FolderItem = { name: string; count: number }

export function RecipeList() {
  const state = useRecipes()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const location = useLocation()
  const [currentPath, setCurrentPath] = useState<string[]>(
    (location.state as { folderPath?: string[] } | null)?.folderPath ?? []
  )
  const [tagsExpanded, setTagsExpanded] = useState(false)

  // When navigating back from a recipe, restore the folder the user came from
  useEffect(() => {
    const state = location.state as { folderPath?: string[] } | null
    if (state?.folderPath) setCurrentPath(state.folderPath)
  }, [location.state])

  const isSearching = query.trim().length > 0 || activeTag !== null

  const allTags = useMemo(() => {
    if (state.status !== 'ok') return []
    const freq = new Map<string, number>()
    for (const r of state.data.recipes) {
      for (const t of r.tags) freq.set(t, (freq.get(t) ?? 0) + 1)
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
      .map(([t]) => t)
  }, [state])

  // Recipes that live directly at currentPath (category === path joined with /)
  // and sub-folders visible from currentPath
  const { subFolders, directRecipes } = useMemo(() => {
    if (state.status !== 'ok') return { subFolders: [] as FolderItem[], directRecipes: [] as RecipeEntry[] }
    const pathPrefix = currentPath.join('/')

    const folderCounts = new Map<string, number>()
    const direct: RecipeEntry[] = []

    for (const r of state.data.recipes) {
      const cat = r.category ?? ''
      if (pathPrefix === '') {
        // Root: direct recipes have no category
        if (!cat) { direct.push(r); continue }
        // Sub-folder is the first path component
        const topLevel = cat.split('/')[0]
        folderCounts.set(topLevel, (folderCounts.get(topLevel) ?? 0) + 1)
      } else {
        if (cat === pathPrefix) {
          direct.push(r)
        } else if (cat.startsWith(pathPrefix + '/')) {
          // Next path component after prefix
          const rest = cat.slice(pathPrefix.length + 1)
          const nextSegment = rest.split('/')[0]
          folderCounts.set(nextSegment, (folderCounts.get(nextSegment) ?? 0) + 1)
        }
      }
    }

    return {
      subFolders: [...folderCounts.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'de'))
        .map(([name, count]) => ({ name, count })),
      directRecipes: direct,
    }
  }, [state, currentPath])

  // Search: flat filtered list across everything
  const filteredRecipes = useMemo(() => {
    if (state.status !== 'ok') return []
    const q = query.trim().toLowerCase()
    return state.data.recipes.filter((r) => {
      if (activeTag && !r.tags.includes(activeTag)) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        (r.category ?? '').toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [state, query, activeTag])

  const searchGrouped = useMemo(() => {
    const map = new Map<string, RecipeEntry[]>()
    for (const r of filteredRecipes) {
      const key = r.category ?? ''
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    return map
  }, [filteredRecipes])

  function navigateTo(segment: string) {
    setCurrentPath([...currentPath, segment])
  }

  function navigateToIndex(idx: number) {
    setCurrentPath(currentPath.slice(0, idx))
  }

  const header = (
    <header
      className="sticky top-0 z-10 border-b px-4 pt-safe-top"
      style={{ backgroundColor: 'var(--color-parchment)', borderColor: 'var(--color-parchment-dark)' }}
    >
      <div className="mx-auto max-w-lg">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-x-1 pt-4">
          {currentPath.length === 0 ? (
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              Meine Rezepte
            </h1>
          ) : (
            <>
              <button
                onClick={() => navigateToIndex(0)}
                className="text-sm font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                Meine Rezepte
              </button>
              {currentPath.map((segment, i) => (
                <span key={i} className="flex items-center gap-x-1">
                  <span className="opacity-30">›</span>
                  {i < currentPath.length - 1 ? (
                    <button
                      onClick={() => navigateToIndex(i + 1)}
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {segment}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold">{segment}</span>
                  )}
                </span>
              ))}
            </>
          )}
        </div>

        {/* Search */}
        <div className="mt-3">
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCurrentPath([]) }}
            placeholder="Suchen nach Name oder Tag…"
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition-colors placeholder:opacity-40"
            style={{ backgroundColor: 'var(--color-parchment-dark)', borderColor: 'transparent', color: 'var(--color-ink)' }}
          />
        </div>

        {/* Tag cloud */}
        {allTags.length > 0 && (
          <div className="mt-2 pb-3 flex flex-wrap gap-2">
            {(tagsExpanded ? allTags : allTags.slice(0, 3)).map((tag) => (
              <button
                key={tag}
                onClick={() => { setActiveTag(activeTag === tag ? null : tag); setCurrentPath([]) }}
                className="flex-none rounded-full px-3 py-1 text-sm font-medium transition-all active:scale-95"
                style={
                  activeTag === tag
                    ? { backgroundColor: 'var(--color-accent)', color: 'white' }
                    : { backgroundColor: 'var(--color-parchment-dark)', color: 'var(--color-ink-muted)' }
                }
              >
                #{tag}
              </button>
            ))}
            {allTags.length > 3 && (
              <button
                onClick={() => setTagsExpanded((v) => !v)}
                className="flex-none rounded-full px-3 py-1 text-sm font-medium transition-all active:scale-95"
                style={{ backgroundColor: 'var(--color-parchment-dark)', color: 'var(--color-ink-muted)' }}
              >
                {tagsExpanded ? 'Weniger ↑' : `+${allTags.length - 3} mehr`}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )

  if (state.status === 'loading') return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--color-parchment)' }}>
      {header}
      <p className="mt-10 text-center opacity-50">Laden…</p>
    </div>
  )

  if (state.status === 'error') return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--color-parchment)' }}>
      {header}
      <p className="mt-10 text-center text-red-600">Fehler: {state.message}</p>
    </div>
  )

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--color-parchment)' }}>
      {header}

      <main className="mx-auto max-w-lg px-4 pb-12">

        {/* ── Search mode: flat list grouped by folder ── */}
        {isSearching && (
          filteredRecipes.length === 0
            ? <p className="mt-10 text-center opacity-50">Keine Rezepte gefunden.</p>
            : [...searchGrouped.entries()]
                .sort(([a], [b]) => a.localeCompare(b, 'de'))
                .map(([cat, recipes]) => (
                  <section key={cat} className="mt-6">
                    {cat && <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest opacity-50">{cat}</h2>}
                    <RecipeCardList recipes={recipes} activeTag={activeTag} folderPath={[]} />
                  </section>
                ))
        )}

        {/* ── Browse mode ── */}
        {!isSearching && (
          <>
            {/* Sub-folders */}
            {subFolders.length > 0 && (
              <section className="mt-6">
                <ul
                  className="divide-y rounded-2xl overflow-hidden"
                  style={{ borderColor: 'var(--color-parchment-dark)', backgroundColor: 'white' }}
                >
                  {subFolders.map((f) => (
                    <li key={f.name}>
                      <button
                        onClick={() => navigateTo(f.name)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:opacity-70"
                        style={{ minHeight: '60px' }}
                      >
                        <span
                          className="flex h-12 w-12 flex-none items-center justify-center rounded-lg text-xl"
                          style={{ backgroundColor: 'var(--color-accent-light)' }}
                          aria-hidden
                        >
                          📁
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{f.name}</p>
                          <p className="text-sm opacity-50">{f.count} Rezept{f.count !== 1 ? 'e' : ''}</p>
                        </div>
                        <span className="opacity-30 text-lg">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Recipes at current level */}
            {directRecipes.length > 0 && (
              <section className="mt-6">
                {subFolders.length > 0 && (
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest opacity-50">
                    Rezepte
                  </h2>
                )}
                <RecipeCardList recipes={directRecipes} activeTag={activeTag} folderPath={currentPath} />
              </section>
            )}

            {subFolders.length === 0 && directRecipes.length === 0 && (
              <p className="mt-10 text-center opacity-50">Keine Rezepte hier.</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function RecipeCardList({ recipes, activeTag, folderPath }: { recipes: RecipeEntry[]; activeTag: string | null; folderPath: string[] }) {
  return (
    <ul
      className="divide-y rounded-2xl overflow-hidden"
      style={{ borderColor: 'var(--color-parchment-dark)', backgroundColor: 'white' }}
    >
      {recipes.map((r) => <RecipeCard key={r.slug} recipe={r} activeTag={activeTag} folderPath={folderPath} />)}
    </ul>
  )
}

function RecipeCard({ recipe, activeTag, folderPath }: { recipe: RecipeEntry; activeTag: string | null; folderPath: string[] }) {
  return (
    <li>
      <Link
        to={`/recipe/${recipe.slug}`}
        state={{ folderPath }}
        className="flex items-center gap-3 px-4 py-3.5 transition-colors active:opacity-70"
        style={{ minHeight: '60px' }}
      >
        {recipe.image ? (
          <img src={recipeUrl(recipe.image)} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" loading="lazy" />
        ) : (
          <span
            className="flex h-12 w-12 flex-none items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: 'var(--color-accent-light)' }}
            aria-hidden
          >
            🍳
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" style={{ color: 'var(--color-ink)' }}>{recipe.title}</p>
          {recipe.tags.length > 0 && (
            <div className="mt-0.5 flex gap-1 flex-wrap">
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs"
                  style={{ color: activeTag === t ? 'var(--color-accent)' : 'var(--color-ink-muted)', fontWeight: activeTag === t ? 600 : 400 }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="opacity-30 text-lg">›</span>
      </Link>
    </li>
  )
}
