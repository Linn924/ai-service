export type StreamPayload = {
  type: "delta" | "done" | "error";
  delta?: string;
  message?: string;
  conversationId?: string;
  messageId?: string;
  taskId?: string;
  source?: string;
};

type StreamHandlers = {
  onMessage: (payload: StreamPayload) => void;
};

function parseBlock(block: string) {
  const dataLines = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  if (!dataLines.length) {
    return [];
  }

  try {
    return [JSON.parse(dataLines.join("\n")) as StreamPayload];
  } catch {
    return [];
  }
}

function parseBuffer(buffer: string, onMessage: (payload: StreamPayload) => void) {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() || "";

  for (const part of parts) {
    for (const payload of parseBlock(part.trim())) {
      onMessage(payload);
    }
  }

  return rest;
}

function decodeArrayBuffer(arrayBuffer: ArrayBuffer) {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder("utf-8").decode(arrayBuffer);
  }

  const bytes = Array.from(new Uint8Array(arrayBuffer));
  const encoded = bytes.map((byte) => `%${byte.toString(16).padStart(2, "0")}`).join("");
  return decodeURIComponent(encoded);
}

export async function streamByFetch(
  url: string,
  body: unknown,
  handlers: StreamHandlers,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    buffer = parseBuffer(buffer, handlers.onMessage);

    if (done) {
      if (buffer.trim()) {
        parseBuffer(`${buffer}\n\n`, handlers.onMessage);
      }
      break;
    }
  }
}

export function streamByWeixinRequest(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
  handlers: StreamHandlers,
) {
  const wxRef = (globalThis as Record<string, unknown>).wx as {
    request: (options: Record<string, unknown>) => {
      onChunkReceived?: (callback: (result: { data: ArrayBuffer }) => void) => void;
    };
  } | undefined;

  if (!wxRef?.request) {
    throw new Error("Current environment does not support Weixin chunked requests");
  }

  return new Promise<void>((resolve, reject) => {
    let buffer = "";
    let failed = false;

    const task = wxRef.request({
      url,
      method: "POST",
      data: body,
      enableChunked: true,
      responseType: "arraybuffer",
      header: headers,
      success: () => {
        if (!failed) {
          resolve();
        }
      },
      fail: (error: { errMsg?: string }) => {
        failed = true;
        reject(new Error(error.errMsg || "Streaming request failed"));
      },
    });

    task.onChunkReceived?.((result) => {
      buffer += decodeArrayBuffer(result.data);
      buffer = parseBuffer(buffer, handlers.onMessage);
    });
  });
}
