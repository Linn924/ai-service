<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { askQuestionStream } from "@/api/chat";
import { clearStoredUser, getStoredUser } from "@/utils/storage";
import type { StreamPayload } from "@/utils/stream";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
};

const user = ref(getStoredUser());
const draft = ref("");
const error = ref("");
const loading = ref(false);
const conversationId = ref("");
const scrollIntoView = ref("");
const messages = ref<Message[]>([
  {
    id: "welcome",
    role: "assistant",
    content: "你好，我是你的智能客服助手。你可以直接提问，我会通过后端流式转发 Dify 的回答。",
    source: "system",
  },
]);

const displayName = computed(() => user.value?.displayName || "访客");

onLoad(() => {
  if (!user.value) {
    uni.reLaunch({
      url: "/pages/index/index",
    });
  }
});

function syncScroll(id: string) {
  nextTick(() => {
    scrollIntoView.value = id;
  });
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
    source: "dify",
  });

  draft.value = "";
  error.value = "";
  loading.value = true;
  syncScroll(assistantId);

  try {
    await askQuestionStream({
      query: text,
      conversationId: conversationId.value,
      userId: user.value.username,
    }, (payload: StreamPayload) => {
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
            source: payload.source || message.source,
          };
        });
        syncScroll(assistantId);
        return;
      }

      if (payload.type === "error") {
        throw new Error(payload.message || "Streaming failed");
      }
    });
  } catch (err) {
    messages.value = messages.value.filter((message) => message.id !== assistantId || message.content);
    error.value = err instanceof Error ? err.message : "发送失败";
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  conversationId.value = "";
  error.value = "";
  messages.value = [messages.value[0]];
}

function handleLogout() {
  clearStoredUser();
  uni.reLaunch({
    url: "/pages/index/index",
  });
}
</script>

<template>
  <view class="chat-page">
    <view class="chat-header">
      <view>
        <text class="header-label">Customer Service Assistant</text>
        <text class="header-title">知识库智能问答</text>
      </view>
      <view class="user-card">
        <text class="user-name">{{ displayName }}</text>
        <text class="user-desc">已登录</text>
      </view>
    </view>

    <view class="toolbar">
      <text class="conversation">{{ conversationId || "尚未建立 Dify 会话" }}</text>
      <view class="toolbar-actions">
        <button size="mini" class="ghost-btn" @click="handleReset">新会话</button>
        <button size="mini" class="ghost-btn danger" @click="handleLogout">退出</button>
      </view>
    </view>

    <scroll-view
      class="message-list"
      scroll-y
      :scroll-into-view="scrollIntoView"
      :enhanced="true"
      :show-scrollbar="false"
    >
      <view
        v-for="message in messages"
        :id="message.id"
        :key="message.id"
        class="message"
        :class="message.role"
      >
        <view class="avatar">{{ message.role === "user" ? "我" : "AI" }}</view>
        <view class="bubble">
          <text class="content">{{ message.content || "..." }}</text>
          <text v-if="message.source" class="source">source: {{ message.source }}</text>
        </view>
      </view>
    </scroll-view>

    <text v-if="error" class="error">{{ error }}</text>

    <view class="composer">
      <textarea
        v-model="draft"
        class="composer-input"
        auto-height
        maxlength="-1"
        placeholder="输入问题，例如：这个产品支持哪些售后服务？"
      />
      <button class="send-btn" :disabled="loading || !draft.trim()" @click="handleSend">
        {{ loading ? "生成中..." : "发送" }}
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.chat-page {
  min-height: 100vh;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  background:
    linear-gradient(180deg, #f4f6f2 0%, #eef3ff 48%, #f9f8f4 100%);
}

.chat-header,
.toolbar,
.composer {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 24rpx;
  box-shadow: 0 20rpx 40rpx rgba(30, 44, 82, 0.08);
}

.chat-header {
  padding: 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.header-label {
  display: block;
  font-size: 22rpx;
  color: #61708f;
  text-transform: uppercase;
  letter-spacing: 2rpx;
}

.header-title {
  display: block;
  margin-top: 8rpx;
  font-size: 42rpx;
  font-weight: 700;
  color: #18243c;
}

.user-card {
  min-width: 156rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: #f2f7ff;
}

.user-name,
.user-desc {
  display: block;
  text-align: right;
}

.user-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e355b;
}

.user-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #6c7891;
}

.toolbar {
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.conversation {
  flex: 1;
  font-size: 24rpx;
  color: #56627a;
}

.toolbar-actions {
  display: flex;
  gap: 12rpx;
}

.ghost-btn {
  margin: 0;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #244061;
  border: none;
}

.ghost-btn.danger {
  background: #fff1f1;
  color: #a22727;
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: 8rpx 4rpx;
}

.message {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  margin-bottom: 18rpx;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f7a4c 0%, #2e90fa 100%);
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
}

.bubble {
  max-width: 80%;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 12rpx 28rpx rgba(25, 40, 76, 0.08);
}

.message.user .bubble {
  background: linear-gradient(135deg, #1f7a4c 0%, #2e90fa 100%);
}

.message.user .content,
.message.user .source {
  color: #fff;
}

.content {
  font-size: 28rpx;
  line-height: 1.65;
  color: #1c2940;
  white-space: pre-wrap;
}

.source {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #66748e;
}

.error {
  font-size: 26rpx;
  color: #c62828;
  padding: 0 6rpx;
}

.composer {
  padding: 20rpx;
  display: flex;
  gap: 16rpx;
  align-items: flex-end;
}

.composer-input {
  flex: 1;
  max-height: 240rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f5f7fb;
  font-size: 28rpx;
  color: #16233c;
}

.send-btn {
  margin: 0;
  width: 148rpx;
  border-radius: 22rpx;
  background: #1f7a4c;
  color: #fff;
  font-size: 28rpx;
}
</style>
