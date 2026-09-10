import { Download, File, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api, errorMessage } from '../lib/client'

type StoredFile = { id: string; name: string; size: number; uploadedAt: string }

export function FilesPanel() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    let cancelled = false
    api<StoredFile[]>('/api/files')
      .then((rows) => {
        if (!cancelled) setFiles(rows)
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
    setError('')
    setBusy(true)
    try {
      await action()
      setFiles(await api('/api/files'))
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <div className="upload-box">
        <Upload size={26} />
        <h3>Make room for your references.</h3>
        <p>Keep a file close at hand. Up to 5 MiB each.</p>
        <input
          ref={input}
          type="file"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (file.size > 5 * 1024 * 1024) {
              setError('Choose a file smaller than 5 MiB.')
              return
            }
            void run(async () => {
              await api('/api/files', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/octet-stream',
                  'X-File-Name': encodeURIComponent(file.name),
                },
                body: file,
              })
            })
            event.target.value = ''
          }}
        />
        <button
          className="button-secondary"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          Choose a file
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="panel-footnote" role="status">
          Working…
        </p>
      )}
      <div className="files-list">
        {files.map((file) => (
          <article className="file-row" key={file.id}>
            <File size={19} />
            <div className="file-info">
              <strong>{file.name}</strong>
              <span>{(file.size / 1024).toFixed(1)} KiB</span>
            </div>
            <a
              className="icon-button"
              href={`/api/files/${file.id}`}
              aria-label={`Download ${file.name}`}
            >
              <Download size={17} />
            </a>
            <button
              className="icon-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api(`/api/files/${file.id}`, { method: 'DELETE' })
                })
              }
              aria-label={`Delete ${file.name}`}
            >
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </div>
      <p className="panel-footnote">
        Files are private to your account. Showing up to 100 files.
      </p>
    </div>
  )
}
