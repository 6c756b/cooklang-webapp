import { useState, useEffect } from 'react'
import { parseRecipe, type ParsedRecipe } from '../lib/cooklang'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: ParsedRecipe }

export function useRecipe(path: string | undefined, scale: number) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (!path) return
    setState({ status: 'loading' })
    let cancelled = false

    fetch(`/recipes/${path}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => {
        if (cancelled) return
        const data = parseRecipe(text, scale)
        setState({ status: 'ok', data })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: String(e) })
      })

    return () => { cancelled = true }
  }, [path, scale])

  return state
}
