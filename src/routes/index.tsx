import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Lightbulb,
  MessageSquare,
  NotebookPen,
  Paperclip,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { ChatPanel } from '../components/chat-panel'
import { NotesPanel } from '../components/notes-panel'
import { FilesPanel } from '../components/files-panel'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { config } = Route.useRouteContext()
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Hackalem home">
          <span className="brand-mark">h.</span>hackalem
          <span className="brand-divider" />
          <span className="team">nullptr</span>
        </a>
        <div className="header-right">
          <span className="hackathon-label">
            <span className="status-dot" />
            Hackathon workspace
          </span>
          {config.authEnabled && (
            <>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="button button-small">
                    Sign in <ArrowUpRight size={14} />
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </>
          )}
        </div>
      </header>
      <main>
        <section className="hero">
          <p className="eyebrow">
            <Sparkles size={14} /> A SPACE TO BUILD SOMETHING GOOD
          </p>
          <h1>
            Big ideas.
            <br />
            <span>Small beginnings.</span>
          </h1>
          <p className="hero-copy">
            A thought, a conversation, a rough first draft.
            <br className="desktop-break" /> Give your next idea a place to
            start.
          </p>
          <div className="hero-orbit" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="idea-tile">
              <Lightbulb strokeWidth={1.3} size={58} />
            </div>
            <span className="orbit-star star-one">✦</span>
            <span className="orbit-star star-two">✧</span>
            <span className="orbit-dot" />
          </div>
        </section>
        {config.authEnabled ? (
          <>
            <Show when="signed-in">
              <Workspace
                chatEnabled={config.chatEnabled}
                searchEnabled={config.searchEnabled}
              />
            </Show>
            <Show when="signed-out">
              <Welcome configured />
            </Show>
          </>
        ) : (
          <Welcome configured={false} />
        )}
      </main>
      <footer>
        <span>Made for the start of something.</span>
        <span>
          TEAM NULLPTR <span className="footer-dot">·</span> HACKALEM
        </span>
      </footer>
    </div>
  )
}

function Welcome({ configured }: { configured: boolean }) {
  return (
    <section className="welcome">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>Everything begins here.</h2>
        </div>
        <span className="quiet-label">01 — Make it happen</span>
      </div>
      <div className="feature-grid">
        <article className="feature-card">
          <span className="feature-icon mint">
            <NotebookPen size={21} />
          </span>
          <h3>Catch the idea</h3>
          <p>A home for the notes and small details you don’t want to lose.</p>
          <span className="card-caption">
            A little clarity goes a long way.
          </span>
        </article>
        <article className="feature-card">
          <span className="feature-icon peach">
            <MessageSquare size={21} />
          </span>
          <h3>Think it through</h3>
          <p>
            Work through a question, explore a direction, or find your next
            step.
          </p>
          <span className="card-caption">Meet your AI thinking partner.</span>
        </article>
        <article className="feature-card">
          <span className="feature-icon lilac">
            <Paperclip size={21} />
          </span>
          <h3>Keep it together</h3>
          <p>
            Bring your references and files into one small, organized space.
          </p>
          <span className="card-caption">Less searching. More making.</span>
        </article>
      </div>
      <div className="welcome-action">
        {configured ? (
          <>
            <p>Your ideas deserve a place of their own.</p>
            <SignInButton mode="modal">
              <button className="button">
                Open your workspace <ArrowUpRight size={17} />
              </button>
            </SignInButton>
          </>
        ) : (
          <>
            <p>
              <strong>Your workspace is taking shape.</strong>
              <br />
              Sign-in will be available once setup is complete.
            </p>
            <span className="setup-badge">SETUP IN PROGRESS</span>
          </>
        )}
      </div>
    </section>
  )
}

function Workspace({
  chatEnabled,
  searchEnabled,
}: {
  chatEnabled: boolean
  searchEnabled: boolean
}) {
  const [tab, setTab] = useState<'notes' | 'chat' | 'files'>('notes')
  return (
    <section className="workspace">
      <div className="section-heading">
        <h2>Your workspace</h2>
        <span className="quiet-label">A little progress, every day.</span>
      </div>
      <div className="tabs" role="tablist" aria-label="Workspace sections">
        {(
          [
            { id: 'notes', label: 'Notes', icon: NotebookPen },
            { id: 'chat', label: 'AI chat', icon: MessageSquare },
            { id: 'files', label: 'Files', icon: Paperclip },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="panel-notes"
        aria-labelledby="tab-notes"
        hidden={tab !== 'notes'}
      >
        <NotesPanel searchEnabled={searchEnabled} />
      </div>
      <div
        role="tabpanel"
        id="panel-chat"
        aria-labelledby="tab-chat"
        hidden={tab !== 'chat'}
      >
        <ChatPanel enabled={chatEnabled} />
      </div>
      <div
        role="tabpanel"
        id="panel-files"
        aria-labelledby="tab-files"
        hidden={tab !== 'files'}
      >
        <FilesPanel />
      </div>
    </section>
  )
}
