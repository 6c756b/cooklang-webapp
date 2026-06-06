interface Props {
  scale: number
  onChange: (scale: number) => void
}

const PRESETS = [0.5, 1, 2, 3, 4]

export function ScalingControl({ scale, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl p-3"
      style={{ backgroundColor: 'var(--color-parchment-dark)' }}
    >
      <span className="text-sm opacity-50 flex-none">Portionen</span>
      <div className="flex flex-1 justify-end gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="h-9 min-w-9 rounded-xl px-2 text-sm font-semibold transition-all active:scale-95"
            style={
              scale === p
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                  }
                : {
                    backgroundColor: 'white',
                    color: 'var(--color-ink)',
                  }
            }
            aria-pressed={scale === p}
          >
            ×{p}
          </button>
        ))}
      </div>
    </div>
  )
}
