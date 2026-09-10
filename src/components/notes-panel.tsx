import { Search, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, errorMessage, jsonRequest } from '../lib/client'

type Note = { id: string; content: string; createdAt: string; score?: number }

export function NotesPanel({ searchEnabled }: { searchEnabled: boolean }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [content, setContent] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let cancelled = false
    Promise.all([
      api<Note[]>('/api/notes'),
      api<{ content: string }>('/api/draft'),
    ])
      .then(([rows, draft]) => {
        if (!cancelled) {
          setNotes(rows)
          setContent(draft.content)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setError(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void run(async () => {
            await api('/api/notes', jsonRequest('POST', { content }))
            setNotes(await api('/api/notes'))
            setContent('')
            setQuery('')
          })
        }}
      >
        <label htmlFor="note-content">What’s on your mind?</label>
        <textarea
          id="note-content"
          placeholder="An idea worth keeping…"
          value={content}
          maxLength={8000}
          disabled={busy}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
        />
        <div className="form-actions">
          <button
            type="button"
            className="button-secondary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api('/api/draft', jsonRequest('PUT', { content }))
                setNotice('Draft saved for seven days.')
              })
            }
          >
            Save draft
          </button>
          <button className="button" disabled={busy || !content.trim()}>
            Add note
          </button>
        </div>
      </form>
      {searchEnabled && (
        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault()
            void run(async () => {
              setNotes(
                query.trim()
                  ? await api('/api/search', jsonRequest('POST', { query }))
                  : await api('/api/notes'),
              )
            })
          }}
        >
          <input
            aria-label="Search notes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find an idea by meaning…"
            maxLength={2000}
          />
          <button
            className="button-secondary"
            disabled={busy}
            aria-label="Search"
          >
            <Search size={17} />
          </button>
          <button
            className="button-secondary"
            disabled={busy}
            type="button"
            onClick={() =>
              void run(async () => {
                setNotes(await api('/api/notes'))
                setQuery('')
              })
            }
          >
            Show all
          </button>
        </form>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {busy && (
        <p className="panel-footnote" role="status">
          Working…
        </p>
      )}
      {!busy && !notes.length && (
        <p className="empty-hint">
          No notes here yet. Start with a single thought.
        </p>
      )}
      <div className="notes-list">
        {notes.map((note) => (
          <article className="note" key={note.id}>
            <p>{note.content}</p>
            <div className="note-bottom">
              <time dateTime={note.createdAt}>
                {new Date(note.createdAt).toLocaleDateString()}
              </time>
              <div className="inline-actions">
                {searchEnabled && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await api(`/api/notes/${note.id}/embed`, {
                          method: 'POST',
                        })
                        setNotice(
                          'Added to search. Results may take a few seconds to appear.',
                        )
                      })
                    }
                  >
                    <Sparkles size={14} />
                    Add to search
                  </button>
                )}
                <button
                  className="icon-button"
                  aria-label="Delete note"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api(`/api/notes/${note.id}`, { method: 'DELETE' })
                      setNotes(notes.filter(({ id }) => id !== note.id))
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="panel-footnote">
        Your latest 100 notes. Drafts are saved separately.
      </p>
    </div>
  )
}
