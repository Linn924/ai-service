<script setup lang="ts">
import { nextTick, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { askQuestionStream } from "@/api/chat";
import { getStoredUser } from "@/utils/storage";
import type { StreamPayload } from "@/utils/stream";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
    content: "你好，请直接输入你的问题。",
  },
]);

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
  });

  draft.value = "";
  error.value = "";
  loading.value = true;
  syncScroll(assistantId);

  try {
    await askQuestionStream(
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

        if (payload.type === "error") {
          throw new Error(payload.message || "Streaming failed");
        }
      },
    );
  } catch (err) {
    messages.value = messages.value.filter((message) => message.id !== assistantId || message.content);
    error.value = err instanceof Error ? err.message : "发送失败";
  } finally {
    loading.value = false;
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
    >
      <view
        v-for="message in messages"
        :id="message.id"
        :key="message.id"
        class="message"
        :class="message.role"
      >
        <view class="bubble">
          <text class="content">{{ message.content || "..." }}</text>
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
        placeholder="请输入问题"
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
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  background: #f5f7fb;
}

.message-list {
  flex: 1;
  min-height: 0;
}

.message {
  display: flex;
  margin-bottom: 16rpx;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 82%;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(30, 44, 82, 0.08);
}

.message.user .bubble {
  background: #2563eb;
}

.message.user .content {
  color: #ffffff;
}

.content {
  font-size: 28rpx;
  line-height: 1.7;
  color: #1c2940;
  white-space: pre-wrap;
}

.error {
  font-size: 24rpx;
  color: #dc2626;
  padding: 0 4rpx;
}

.composer {
  padding: 16rpx;
  display: flex;
  gap: 16rpx;
  align-items: flex-end;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 28rpx rgba(30, 44, 82, 0.08);
}

.composer-input {
  flex: 1;
  max-height: 240rpx;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  font-size: 28rpx;
  color: #0f172a;
}

.send-btn {
  margin: 0;
  width: 140rpx;
  border-radius: 16rpx;
  background: #2563eb;
  color: #ffffff;
  font-size: 28rpx;
}
</style>
