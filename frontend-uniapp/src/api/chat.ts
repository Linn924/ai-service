import { API_BASE, getAuthHeaders, request } from "@/utils/request";
import { streamByFetchTask, streamByWeixinRequest, type StreamPayload, type StreamTask } from "@/utils/stream";

export type ChatReply = {
  answer: string;
  conversationId?: string;
  messageId?: string;
  source?: string;
};

export function askQuestion(data: {
  query: string;
  conversationId?: string;
  userId: string;
}) {
  return request<ChatReply>({
    path: "/api/ai/chat",
    data,
  });
}

export function askQuestionStream(
  data: {
    query: string;
    conversationId?: string;
    userId: string;
  },
  onMessage: (payload: StreamPayload) => void,
) : StreamTask {
  const url = `${API_BASE}/api/ai/chat/stream`;
  const headers = getAuthHeaders();

  // #ifdef MP-WEIXIN
  return streamByWeixinRequest(url, data, headers, { onMessage });
  // #endif

  // #ifndef MP-WEIXIN
  return streamByFetchTask(url, data, { onMessage });
  // #endif
}
