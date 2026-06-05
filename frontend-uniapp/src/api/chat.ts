import { request } from "@/utils/request";

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
