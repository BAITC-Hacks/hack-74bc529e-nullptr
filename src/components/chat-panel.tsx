import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { ArrowUp, MessageSquare, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DEFAULT_CHAT_MODEL } from '../lib/chat-models'
import { ModelSelector } from './model-selector'

const connection = fetchServerSentEvents('/api/chat')

export function ChatPanel({ enabled }: { enabled: boolean }) {
  const [input, setInput] = useState('')
  const [model, setModel] = useState(DEFAULT_CHAT_MODEL)
  const { messages, sendMessage, isLoading, stop, error } = useChat({
    connection,
    body: { model },
  })
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  return (
    <div className="panel">
      <ModelSelector
        value={model}
        onChange={setModel}
        enabled={enabled}
        disabled={isLoading}
      />
      <div className="chat-messages" aria-live="polite" aria-busy={isLoading}>
        {!messages.length && (
          <div className="empty-state">
            <MessageSquare size={28} />
            <h3>A fresh perspective starts with a question.</h3>
            <p>
              {enabled
                ? 'Tell me what you’re thinking about.'
                : 'Your AI assistant will be available once its API key is configured.'}
            </p>
          </div>
        )}
        {messages.map((message) => (
          <article className={`message ${message.role}`} key={message.id}>
            <span className="message-role">
              {message.role === 'user' ? 'You' : 'Hackalem'}
            </span>
            {message.parts.map((part, index) =>
              part.type === 'text' ? <p key={index}>{part.content}</p> : null,
            )}
          </article>
        ))}
        <div ref={bottom} />
      </div>
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault()
          if (!input.trim() || isLoading || !enabled) return
          void sendMessage(input)
          setInput('')
        }}
      >
        <input
          aria-label="Message"
          placeholder="What are you working on?"
          value={input}
          maxLength={8000}
          disabled={!enabled}
          onChange={(event) => setInput(event.target.value)}
        />
        {isLoading ? (
          <button
            className="icon-button button"
            type="button"
            onClick={stop}
            aria-label="Stop response"
          >
            <Square size={17} />
          </button>
        ) : (
          <button
            className="icon-button button"
            disabled={!enabled || !input.trim()}
            aria-label="Send message"
          >
            <ArrowUp size={19} />
          </button>
        )}
      </form>
      <p className="panel-footnote">
        AI can make mistakes. Chat history lasts for this page session.
      </p>
    </div>
  )
}
