import type { Section, Item, Ingredient, Cookware, Timer } from '../lib/cooklang'
import { quantity_display } from '@cooklang/cooklang'

interface Props {
  sections: Section[]
  ingredients: Ingredient[]
  cookware: Cookware[]
  timers: Timer[]
}

export function StepList({ sections, ingredients, cookware, timers }: Props) {
  return (
    <div className="space-y-8">
      {sections.map((section, si) => (
        <div key={si}>
          {section.name && (
            <h3
              className="mb-4 border-b pb-1 text-base font-semibold"
              style={{
                borderColor: 'var(--color-parchment-dark)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {section.name}
            </h3>
          )}
          <ol className="space-y-5">
            {section.content.map((c, ci) => {
              if (c.type === 'text') {
                // Freeform note/text block (not a numbered step)
                return (
                  <li key={ci}>
                    <p
                      className="text-sm leading-relaxed italic opacity-60"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {c.value}
                    </p>
                  </li>
                )
              }
              const step = c.value
              return (
                <li key={ci} className="flex gap-4">
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: 'var(--color-accent)', marginTop: '1px' }}
                  >
                    {step.number}
                  </span>
                  <p className="flex-1 text-base leading-7">
                    {step.items.map((item, ii) =>
                      renderItem(item, ii, ingredients, cookware, timers),
                    )}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}

function renderItem(
  item: Item,
  key: number,
  ingredients: Ingredient[],
  cookware: Cookware[],
  timers: Timer[],
): React.ReactNode {
  if (item.type === 'text') {
    return <span key={key}>{item.value}</span>
  }

  if (item.type === 'ingredient') {
    const ing = ingredients[item.index]
    if (!ing) return null
    const qtyStr = ing.quantity ? quantity_display(ing.quantity) : ''
    const label = [qtyStr, ing.alias ?? ing.name].filter(Boolean).join(' ')
    return (
      <span key={key} className="ingredient-inline" title={ing.note ?? undefined}>
        {label}
      </span>
    )
  }

  if (item.type === 'cookware') {
    const cw = cookware[item.index]
    if (!cw) return null
    return (
      <span key={key} className="cookware-inline">
        {cw.alias ?? cw.name}
      </span>
    )
  }

  if (item.type === 'timer') {
    const t = timers[item.index]
    if (!t) return null
    const qtyStr = t.quantity ? quantity_display(t.quantity) : ''
    const label = t.name ? `${t.name} (${qtyStr})` : qtyStr
    return (
      <span key={key} className="timer-inline">
        ⏱ {label}
      </span>
    )
  }

  return null
}
