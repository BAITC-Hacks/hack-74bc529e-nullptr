import { useEffect, useId, useState } from 'react'
import { DEFAULT_CHAT_MODEL } from '../lib/chat-models'

export function ModelSelector({
  value,
  onChange,
  enabled,
  disabled,
}: {
  value: string
  onChange: (model: string) => void
  enabled: boolean
  disabled: boolean
}) {
  const id = useId()
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    void (async () => {
      try {
        const response = await fetch('/api/models', {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Could not load models.')
        const data = (await response.json()) as { models: string[] }
        if (!data.models.length)
          throw new Error('No chat models are available.')
        setModels(data.models)
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : 'Could not load models.',
          )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [enabled, attempt])

  return (
    <div className="model-selector">
      <label htmlFor={id}>Model</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!enabled || disabled || loading}
        aria-busy={loading}
      >
        {!models.includes(value) && (
          <option value={value}>
            {value}
            {value === DEFAULT_CHAT_MODEL ? ' (default)' : ''}
          </option>
        )}
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
            {model === DEFAULT_CHAT_MODEL ? ' (default)' : ''}
          </option>
        ))}
      </select>
      {loading && <span role="status">Loading models…</span>}
      {error && (
        <span role="alert">
          {error}{' '}
          <button
            type="button"
            className="button-secondary"
            disabled={disabled}
            onClick={() => setAttempt((attempt) => attempt + 1)}
          >
            Retry
          </button>
        </span>
      )}
    </div>
  )
}
