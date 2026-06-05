import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { postSse, type StreamPayload } from './sse'

type User = {
  token: string
  username: string
  displayName: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  source?: string
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

async function requestJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const result = await response.json()
  if (!response.ok || result.code !== 200) {
    throw new Error(result.msg || 'Request failed')
  }
  return result.data as T
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('123456')
  const [question, setQuestion] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'hello',
      role: 'assistant',
      content: '你好，我是本地智能客服助手。你可以直接提问，我会通过后端流式转发 Dify 的回答。',
      source: 'system',
    },
  ])

  const currentDate = useMemo(() => new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()), [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await requestJson<User>('/api/auth/login', { username, password })
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = question.trim()
    if (!text || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    const assistantId = crypto.randomUUID()

    setMessages((items) => [
      ...items,
      userMessage,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        source: 'dify',
      },
    ])
    setQuestion('')
    setError('')
    setLoading(true)

    try {
      await postSse(`${API_BASE}/api/ai/chat/stream`, {
        query: text,
        conversationId,
        userId: user?.username || 'web-user',
      }, (payload: StreamPayload) => {
        if (payload.conversationId) {
          setConversationId(payload.conversationId)
        }

        if (payload.type === 'delta') {
          setMessages((items) => items.map((message) => {
            if (message.id !== assistantId) {
              return message
            }

            return {
              ...message,
              content: `${message.content}${payload.delta || ''}`,
              source: payload.source || message.source,
            }
          }))
          return
        }

        if (payload.type === 'error') {
          throw new Error(payload.message || 'Streaming failed')
        }
      })
    } catch (err) {
      setMessages((items) => items.filter((message) => message.id !== assistantId || message.content))
      setError(err instanceof Error ? err.message : 'Chat request failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <main className="login-shell">
        <section className="login-visual" aria-label="Project overview">
          <div className="signal-board">
            <span>Local Knowledge Base</span>
            <strong>Dify + RuoYi</strong>
            <small>Mini Program AI Support</small>
          </div>
          <div className="pipeline">
            <i>Mini Program</i>
            <i>Backend API</i>
            <i>Dify</i>
            <i>Streaming Reply</i>
          </div>
        </section>

        <section className="login-panel">
          <p className="eyebrow">Local Development</p>
          <h1>智能客服工作台</h1>
          <p className="intro">当前版本已经接入流式问答，可以直接验证打字机效果。</p>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              账号
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </label>
            <label>
              密码
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? '登录中...' : '进入问答'}</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>AI</span>
          <div>
            <strong>客服助手</strong>
            <small>流式应答版</small>
          </div>
        </div>
        <button className="new-chat" onClick={() => {
          setConversationId('')
          setMessages([messages[0]])
        }}>
          新会话
        </button>
        <div className="session-list">
          <p>当前会话</p>
          <button className="session active">
            <span>知识库问答演示</span>
            <small>{conversationId || '尚未连接 Dify 会话'}</small>
          </button>
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Customer Service Assistant</p>
            <h1>知识库智能问答</h1>
          </div>
          <div className="user-chip">
            <span>{user.displayName}</span>
            <small>{currentDate}</small>
          </div>
        </header>

        <section className="messages" aria-live="polite">
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="avatar">{message.role === 'user' ? '我' : 'AI'}</div>
              <div className="bubble">
                <p>{message.content || '...'}</p>
                {message.source && <small>source: {message.source}</small>}
              </div>
            </article>
          ))}
        </section>

        {error && <p className="error inline">{error}</p>}

        <form className="composer" onSubmit={handleAsk}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="输入客户问题，例如：这个产品的售后政策是什么？"
          />
          <button type="submit" disabled={loading || !question.trim()}>
            {loading ? '生成中...' : '发送'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
