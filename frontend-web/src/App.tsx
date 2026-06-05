import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

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
    throw new Error(result.msg || '请求失败')
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
      content: '你好，我是本地智能客服助手。你可以先问一个和知识库有关的问题，我会通过后端接口转发给 Dify。',
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
      setError(err instanceof Error ? err.message : '登录失败')
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
    setMessages((items) => [...items, userMessage])
    setQuestion('')
    setError('')
    setLoading(true)

    try {
      const data = await requestJson<{
        answer: string
        conversationId?: string
        messageId?: string
        source?: string
      }>('/api/ai/chat', {
        query: text,
        conversationId,
        userId: user?.username || 'web-user',
      })

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }
      setMessages((items) => [
        ...items,
        {
          id: data.messageId || crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          source: data.source,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : '问答请求失败')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <main className="login-shell">
        <section className="login-visual" aria-label="项目概览">
          <div className="signal-board">
            <span>本地知识库</span>
            <strong>Dify + RuoYi</strong>
            <small>Mini Program AI Support</small>
          </div>
          <div className="pipeline">
            <i>小程序</i>
            <i>后端接口</i>
            <i>Dify</i>
            <i>云模型</i>
          </div>
        </section>

        <section className="login-panel">
          <p className="eyebrow">Local Development</p>
          <h1>智能客服工作台</h1>
          <p className="intro">先完成用户端登录和问答界面，本地后端负责封装 Dify API。</p>
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
            <small>本地开发版</small>
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
            <span>知识库问答测试</span>
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
                <p>{message.content}</p>
                {message.source && <small>source: {message.source}</small>}
              </div>
            </article>
          ))}
          {loading && user && (
            <article className="message assistant">
              <div className="avatar">AI</div>
              <div className="bubble thinking">正在检索知识库并生成回答...</div>
            </article>
          )}
        </section>

        {error && <p className="error inline">{error}</p>}

        <form className="composer" onSubmit={handleAsk}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="输入客户问题，例如：这个产品的售后政策是什么？"
          />
          <button type="submit" disabled={loading || !question.trim()}>
            发送
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
