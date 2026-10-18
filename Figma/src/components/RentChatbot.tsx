import { FormEvent, useEffect, useRef, useState } from "react"
import { genai, type ChatTurn } from "../lib/genai"

type Bubble = ChatTurn & { id: number }

const WELCOME: Bubble = {
  id: 0,
  role: "assistant",
  text: "Hi, I'm the Rent Mate assistant. Ask me about deposits, agency fees, tenancy agreements, scams, utilities or choosing an area.",
}

const STARTERS = [
  "What deposit is normal?",
  "How do I spot a scam?",
  "Agency fee?",
  "Who pays utilities?",
]

export default function RentChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Bubble[]>([WELCOME])
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy, open])

  async function send(text: string) {
    const message = text.trim()
    if (!message || busy) return
    const history = messages.map(({ role, text: t }) => ({ role, text: t }))
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: message }])
    setDraft("")
    setBusy(true)
    try {
      const reply = await genai.chat(history, message)
      setMessages((m) => [
        ...m,
        { id: nextId.current++, role: "assistant", text: reply.text },
      ])
      setSuggestions(reply.suggestions)
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          className="rent-bot-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open rental assistant"
        >
          <span className="rent-bot-dot" />
          <span>
            <b>Ask Rent Mate</b>
            <small>Hong Kong renting questions</small>
          </span>
        </button>
      )}

      {open && (
        <section className="rent-bot" aria-label="Rental assistant">
          <header>
            <div>
              <b>Rent Mate assistant</b>
              <small>Renting basics · English · not legal advice</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </header>

          <div className="rent-bot-stream">
            {messages.map((m) => (
              <div key={m.id} className={`rent-bot-msg ${m.role}`}>
                {m.text.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ))}
            {busy && <div className="rent-bot-msg assistant typing">Thinking…</div>}
            <div ref={endRef} />
          </div>

          <div className="rent-bot-suggestions">
            {suggestions.slice(0, 3).map((s) => (
              <button key={s} type="button" onClick={() => void send(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>

          <form className="rent-bot-form" onSubmit={onSubmit}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about renting in Hong Kong…"
              maxLength={300}
            />
            <button type="submit" disabled={busy || !draft.trim()}>
              Send
            </button>
          </form>
        </section>
      )}
    </>
  )
}
