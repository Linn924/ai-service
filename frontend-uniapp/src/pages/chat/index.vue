<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { askQuestionStream } from "@/api/chat";
import { renderMarkdown } from "@/utils/markdown";
import { getStoredUser } from "@/utils/storage";
import type { StreamPayload, StreamTask } from "@/utils/stream";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "这个产品支持哪些售后服务？",
  "请介绍一下套餐价格。",
  "发货时间一般要多久？",
];

const user = ref(getStoredUser());
const draft = ref("");
const error = ref("");
const loading = ref(false);
const conversationId = ref("");
const scrollIntoView = ref("");
const safeAreaBottom = ref(0);
const activeAssistantId = ref("");
const currentTask = ref<StreamTask | null>(null);
const messages = ref<Message[]>([
  {
    id: "welcome",
    role: "assistant",
    content: "你好，请直接输入你的问题。",
  },
]);

const composerWrapStyle = computed(() => ({
  paddingBottom: `${safeAreaBottom.value}px`,
}));

const messageListStyle = computed(() => ({
  paddingBottom: `${210 + safeAreaBottom.value}px`,
}));

onLoad(() => {
  if (!user.value) {
    uni.reLaunch({
      url: "/pages/index/index",
    });
    return;
  }

  draft.value = "";
  const systemInfo = uni.getSystemInfoSync();
  safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0;
});

function syncScroll(id: string) {
  nextTick(() => {
    scrollIntoView.value = id;
  });
}

function applySuggestion(text: string) {
  if (loading.value) {
    return;
  }
  draft.value = text;
}

function stopReply() {
  currentTask.value?.cancel();
  currentTask.value = null;
  loading.value = false;
  activeAssistantId.value = "";
}

function toMarkdown(content: string) {
  return renderMarkdown(content || "正在生成...");
}

async function handleSend() {
  const text = draft.value.trim();
  if (!user.value || !text || loading.value) {
    return;
  }

  const userId = `user-${Date.now()}`;
  const assistantId = `assistant-${Date.now()}`;

  messages.value.push({
    id: userId,
    role: "user",
    content: text,
  });
  messages.value.push({
    id: assistantId,
    role: "assistant",
    content: "",
  });

  draft.value = "";
  error.value = "";
  loading.value = true;
  activeAssistantId.value = assistantId;
  syncScroll(assistantId);

  try {
    currentTask.value = askQuestionStream(
      {
        query: text,
        conversationId: conversationId.value,
        userId: user.value.username,
      },
      (payload: StreamPayload) => {
        if (payload.conversationId) {
          conversationId.value = payload.conversationId;
        }

        if (payload.type === "delta") {
          messages.value = messages.value.map((message) => {
            if (message.id !== assistantId) {
              return message;
            }

            return {
              ...message,
              content: `${message.content}${payload.delta || ""}`,
            };
          });
          syncScroll(assistantId);
          return;
        }

        if (payload.type === "done") {
          activeAssistantId.value = "";
          return;
        }

        if (payload.type === "error") {
          throw new Error(payload.message || "Streaming failed");
        }
      },
    );

    await currentTask.value.promise;
  } catch (err) {
    messages.value = messages.value.filter((message) => message.id !== assistantId || message.content);
    error.value = err instanceof Error ? err.message : "发送失败";
  } finally {
    currentTask.value = null;
    loading.value = false;
    activeAssistantId.value = "";
  }
}
</script>

<template>
  <view class="chat-page">
    <scroll-view
      class="message-list"
      scroll-y
      :scroll-into-view="scrollIntoView"
      :enhanced="true"
      :show-scrollbar="false"
      :style="messageListStyle"
    >
      <view
        v-for="message in messages"
        :id="message.id"
        :key="message.id"
        class="message-row"
        :class="message.role"
      >
        <view v-if="message.role === 'assistant'" class="assistant-mark">AI</view>

        <view class="bubble" :class="[message.role, { streaming: activeAssistantId === message.id }]">
          <rich-text
            v-if="message.role === 'assistant'"
            class="message-markdown"
            :nodes="toMarkdown(message.content)"
          />
          <text v-else class="message-text">{{ message.content }}</text>

          <view v-if="activeAssistantId === message.id" class="typing-dots">
            <text class="dot"></text>
            <text class="dot"></text>
            <text class="dot"></text>
          </view>
        </view>
      </view>
    </scroll-view>

    <text v-if="error" class="error">{{ error }}</text>

    <view class="composer-wrap" :style="composerWrapStyle">
      <view class="composer-shell">
        <scroll-view class="suggestion-row" scroll-x :show-scrollbar="false">
          <view class="suggestion-list">
            <view
              v-for="item in suggestions"
              :key="item"
              class="suggestion-chip"
              @click="applySuggestion(item)"
            >
              <text>{{ item }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="composer">
          <textarea
            v-model="draft"
            class="composer-input"
            auto-height
            maxlength="-1"
            placeholder="请输入问题"
          />

          <view
            v-if="loading"
            class="action-btn stop-btn"
            @click="stopReply"
          >
            <view class="stop-icon"></view>
          </view>

          <view
            v-else
            class="action-btn send-btn"
            :class="{ disabled: !draft.trim() }"
            @click="handleSend"
          >
            <view class="send-icon"></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.chat-page {
  height: 100vh;
  padding: 20rpx 20rpx 0;
  background: #f4f7fb;
  box-sizing: border-box;
}

.message-list {
  height: 100%;
  box-sizing: border-box;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.message-row.user {
  justify-content: flex-end;
}

.assistant-mark {
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0ecff;
  color: #2563eb;
  font-size: 20rpx;
  font-weight: 700;
}

.bubble {
  max-width: 76%;
  padding: 20rpx 22rpx;
  border-radius: 22rpx;
  box-sizing: border-box;
}

.bubble.assistant {
  background: #ffffff;
  box-shadow: 0 8rpx 22rpx rgba(15, 23, 42, 0.06);
}

.bubble.user {
  background: #2563eb;
}

.bubble.user .message-text {
  color: #ffffff;
}

.bubble.streaming {
  box-shadow: 0 12rpx 28rpx rgba(37, 99, 235, 0.14);
}

.message-text {
  font-size: 28rpx;
  line-height: 1.7;
  color: #0f172a;
  white-space: pre-wrap;
}

.message-markdown {
  display: block;
  font-size: 28rpx;
  line-height: 1.7;
  color: #0f172a;
  word-break: break-word;
}

.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  margin-left: 10rpx;
}

.dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #2563eb;
  animation: blink 1.2s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

.error {
  display: block;
  margin: 0 4rpx 10rpx;
  font-size: 24rpx;
  color: #dc2626;
}

.composer-wrap {
  position: fixed;
  left: 20rpx;
  right: 20rpx;
  bottom: 0;
  box-sizing: border-box;
}

.composer-shell {
  padding: 16rpx;
  border-radius: 24rpx 24rpx 0 0;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -8rpx 26rpx rgba(15, 23, 42, 0.08);
}

.suggestion-row {
  width: 100%;
  margin-bottom: 14rpx;
  white-space: nowrap;
}

.suggestion-list {
  display: inline-flex;
  gap: 12rpx;
}

.suggestion-chip {
  flex-shrink: 0;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: #edf4ff;
  color: #334155;
  font-size: 22rpx;
}

.composer {
  display: flex;
  gap: 14rpx;
  align-items: flex-end;
}

.composer-input {
  flex: 1;
  min-width: 0;
  min-height: 92rpx;
  max-height: 240rpx;
  padding: 18rpx 20rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  font-size: 28rpx;
  color: #0f172a;
  box-sizing: border-box;
}

.action-btn {
  width: 88rpx;
  height: 88rpx;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn {
  background: #2563eb;
}

.send-btn.disabled {
  opacity: 0.45;
}

.stop-btn {
  background: #ef4444;
}

.send-icon {
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-left: 20rpx solid #ffffff;
  margin-left: 6rpx;
}

.stop-icon {
  width: 24rpx;
  height: 24rpx;
  background: #ffffff;
  border-radius: 6rpx;
}

@keyframes blink {
  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}
</style>
