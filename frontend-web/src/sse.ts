export type StreamPayload = {
  type: 'delta' | 'done' | 'error'
  delta?: string
  message?: string
  conversationId?: string
  messageId?: string
  taskId?: string
  source?: string
}

function parseBlock(block: string): StreamPayload[] {
  const dataLines = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())

  if (!dataLines.length) {
    return []
  }

  try {
    return [JSON.parse(dataLines.join('\n')) as StreamPayload]
  } catch {
    return []
  }
}

export async function postSse(
  url: string,
  body: unknown,
  onMessage: (payload: StreamPayload) => void,
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Request failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finished = false

  const handlePayload = (payload: StreamPayload) => {
    onMessage(payload)
    if (payload.type === 'done') {
      finished = true
      void reader.cancel()
    }
    if (payload.type === 'error') {
      throw new Error(payload.message || 'Streaming failed')
    }
  }

  while (!finished) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const part of parts) {
      for (const payload of parseBlock(part.trim())) {
        handlePayload(payload)
      }
    }

    if (done) {
      if (buffer.trim()) {
        for (const payload of parseBlock(buffer.trim())) {
          handlePayload(payload)
        }
      }
      break
    }
  }
}
