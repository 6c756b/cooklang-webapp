import type { FlatIngredient } from '../lib/cooklang'

interface Props {
  ingredients: FlatIngredient[]
}

export function IngredientList({ ingredients }: Props) {
  return (
    <ul
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: 'white',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
      }}
    >
      {ingredients.map((ing, i) => (
        <li
          key={i}
          style={{
            display: 'contents',
          }}
        >
          <span
            className="text-right text-sm font-semibold tabular-nums whitespace-nowrap pl-4 py-3 pr-3"
            style={{
              color: ing.displayText ? 'var(--color-accent)' : 'transparent',
              borderBottom: i < ingredients.length - 1 ? '1px solid var(--color-parchment-dark)' : undefined,
            }}
          >
            {ing.displayText ?? '—'}
          </span>
          <span
            className="text-base pr-4 py-3 min-w-0"
            style={{
              borderBottom: i < ingredients.length - 1 ? '1px solid var(--color-parchment-dark)' : undefined,
            }}
          >
            {ing.name}
            {ing.note && (
              <span className="ml-1.5 text-sm opacity-50">({ing.note})</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
