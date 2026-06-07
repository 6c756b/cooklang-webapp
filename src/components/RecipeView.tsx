import { useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { useRecipe } from '../hooks/useRecipe'
import { IngredientList } from './IngredientList'
import { StepList } from './StepList'
import { ScalingControl } from './ScalingControl'

export function RecipeView() {
  const { '*': slug } = useParams()
  const location = useLocation()
  const folderPath: string[] = (location.state as { folderPath?: string[] } | null)?.folderPath ?? []
  const [scale, setScale] = useState(1)
  const [ingredientsOpen, setIngredientsOpen] = useState(true)

  const indexState = useRecipes()
  const entry =
    indexState.status === 'ok'
      ? indexState.data.recipes.find((r) => r.slug === slug)
      : undefined

  const recipeState = useRecipe(entry?.path, scale)

  const title =
    recipeState.status === 'ok'
      ? recipeState.data.title ?? entry?.title
      : entry?.title

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--color-parchment)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-4 pt-safe-top"
        style={{ backgroundColor: 'var(--color-parchment)', borderColor: 'var(--color-parchment-dark)' }}
      >
        <div className="mx-auto max-w-lg py-3">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-1 text-sm min-w-0">
            <Link
              to="/"
              state={{ folderPath: [] }}
              className="flex-none font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Meine Rezepte
            </Link>
            {folderPath.map((segment, i) => (
              <span key={i} className="flex items-center gap-x-1 flex-none">
                <span className="opacity-30">›</span>
                <Link
                  to="/"
                  state={{ folderPath: folderPath.slice(0, i + 1) }}
                  className="font-medium"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {segment}
                </Link>
              </span>
            ))}
            <span className="opacity-30 flex-none">›</span>
            <h1
              className="truncate font-semibold"
              style={{ fontFamily: 'var(--font-serif)', minWidth: 0 }}
            >
              {title ?? '…'}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16">
        {/* Hero image */}
        {entry?.image && (
          <div className="mt-4 overflow-hidden rounded-2xl">
            <img
              src={`/recipes/${entry.image}`}
              alt={title}
              className="h-52 w-full object-cover"
            />
          </div>
        )}

        {recipeState.status === 'loading' && (
          <p className="mt-12 text-center opacity-50">Laden…</p>
        )}

        {recipeState.status === 'error' && (
          <p className="mt-12 text-center text-red-600">
            Fehler: {recipeState.message}
          </p>
        )}

        {recipeState.status === 'ok' && (() => {
          const recipe = recipeState.data
          return (
            <>
              {/* Meta bar — structured fields + any custom >> metadata keys */}
              <div className="mt-4 flex flex-wrap gap-2">
                {recipe.time && <MetaBadge icon="⏱" label={recipe.time} />}
                {recipe.servings && <MetaBadge icon="👤" label={recipe.servings} />}
                {recipe.tags.map((t) => (
                  <MetaBadge key={t} icon="#" label={t} />
                ))}
                {[...recipe.rawMetadata.entries()]
                  .filter(([k]) => !KNOWN_KEYS.has(String(k).toLowerCase()))
                  .map(([k, v]) => (
                    <MetaBadge key={String(k)} icon="·" label={`${k}: ${v}`} />
                  ))}
              </div>

              {/* Nutrition */}
              {recipe.nutrition && (
                <div
                  className="mt-3 rounded-xl px-4 py-2.5 text-sm"
                  style={{ backgroundColor: 'var(--color-parchment-dark)', color: 'var(--color-ink-muted)' }}
                >
                  <span className="font-medium" style={{ color: 'var(--color-ink)' }}>Nährwerte: </span>
                  {recipe.nutrition}
                </div>
              )}

              {/* Description / note */}
              {recipe.description && (
                <p
                  className="mt-4 text-sm leading-relaxed opacity-70 italic"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {recipe.description}
                </p>
              )}

              {/* Scaling */}
              <div className="mt-5">
                <ScalingControl scale={scale} onChange={setScale} />
              </div>

              {/* Ingredients */}
              {recipe.flatIngredients.length > 0 && (
                <section className="mt-6">
                  <button
                    onClick={() => setIngredientsOpen((v) => !v)}
                    className="mb-3 flex w-full items-center justify-between"
                  >
                    <SectionHeading as="span">Zutaten</SectionHeading>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-parchment-dark)', color: 'var(--color-ink-muted)' }}
                    >
                      {ingredientsOpen ? 'Einklappen' : `${recipe.flatIngredients.length} Zutaten`}
                    </span>
                  </button>
                  {ingredientsOpen && <IngredientList ingredients={recipe.flatIngredients} />}
                </section>
              )}

              {/* Steps */}
              <section className="mt-8">
                <SectionHeading as="h2" >Zubereitung</SectionHeading>
                <StepList
                  sections={recipe.sections}
                  ingredients={recipe.ingredients}
                  cookware={recipe.cookware}
                  timers={recipe.timers}
                />
              </section>
            </>
          )
        })()}
      </main>
    </div>
  )
}

// Keys already shown as structured fields — skip them in the rawMetadata loop
const KNOWN_KEYS = new Set([
  'title', 'description', 'servings', 'time', 'tags', 'author', 'source',
  'course', 'difficulty', 'cuisine', 'diet', 'locale', 'images',
  'prep time', 'cook time', 'nutrition',
])

function MetaBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
      style={{ backgroundColor: 'var(--color-parchment-dark)' }}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

function SectionHeading({ children, as: Tag = 'h2' }: { children: React.ReactNode; as?: 'h2' | 'span' }) {
  return (
    <Tag className="text-xs font-semibold uppercase tracking-widest opacity-50">
      {children}
    </Tag>
  )
}
