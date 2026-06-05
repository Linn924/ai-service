import { API_BASE, getAuthHeaders, request } from "@/utils/request";
import { streamByFetch, streamByWeixinRequest, type StreamPayload } from "@/utils/stream";

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
) {
  const url = `${API_BASE}/api/ai/chat/stream`;
  const headers = getAuthHeaders();

  // #ifdef MP-WEIXIN
  return streamByWeixinRequest(url, data, headers, { onMessage });
  // #endif

  // #ifndef MP-WEIXIN
  return streamByFetch(url, data, { onMessage });
  // #endif
}
