import { useState, useEffect } from 'react'
import type { RecipeIndex } from '../types/recipe'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: RecipeIndex }

export function useRecipes() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/recipes/index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<RecipeIndex>
      })
      .then((data) => { if (!cancelled) setState({ status: 'ok', data }) })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: String(e) })
      })
    return () => { cancelled = true }
  }, [])

  return state
}
