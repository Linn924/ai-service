<script setup lang="ts">
import { reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { login } from "@/api/auth";
import { getStoredUser, setStoredUser } from "@/utils/storage";

const form = reactive({
  username: "demo",
  password: "123456",
});

const loading = ref(false);
const error = ref("");

onLoad(() => {
  if (getStoredUser()) {
    uni.reLaunch({
      url: "/pages/chat/index",
    });
  }
});

async function handleLogin() {
  if (loading.value) {
    return;
  }

  if (!form.username.trim() || !form.password.trim()) {
    error.value = "请输入账号和密码";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const user = await login({
      username: form.username.trim(),
      password: form.password,
    });
    setStoredUser(user);
    uni.reLaunch({
      url: "/pages/chat/index",
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="login-page">
    <view class="login-card">
      <text class="title">智能客服登录</text>
      <text class="subtitle">登录后即可进入问答界面</text>

      <view class="field">
        <text class="label">账号</text>
        <input v-model="form.username" class="input" placeholder="请输入账号" />
      </view>

      <view class="field">
        <text class="label">密码</text>
        <input
          v-model="form.password"
          class="input"
          password
          placeholder="请输入密码"
        />
      </view>

      <text v-if="error" class="error">{{ error }}</text>

      <button class="submit-btn" :loading="loading" @click="handleLogin">
        {{ loading ? "登录中..." : "登录" }}
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  padding: 32rpx;
  display: flex;
  align-items: center;
  background: #f5f7fb;
}

.login-card {
  width: 100%;
  padding: 40rpx 32rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 20rpx 40rpx rgba(30, 44, 82, 0.08);
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #1c2940;
}

.subtitle {
  display: block;
  margin-top: 12rpx;
  margin-bottom: 32rpx;
  font-size: 26rpx;
  color: #6b7280;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.label {
  font-size: 26rpx;
  color: #334155;
}

.input {
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  font-size: 30rpx;
  color: #0f172a;
}

.error {
  display: block;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #dc2626;
}

.submit-btn {
  margin-top: 8rpx;
  border-radius: 18rpx;
  background: #2563eb;
  color: #ffffff;
  font-size: 30rpx;
}
</style>
