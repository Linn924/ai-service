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
  <view class="page login-page">
    <view class="hero-card">
      <text class="eyebrow">Mini Program AI Support</text>
      <text class="title">智能客服小程序</text>
      <text class="subtitle">登录后即可通过后端调用 Dify 知识库和第三方模型。</text>

      <view class="stack">
        <text>微信小程序</text>
        <text>RuoYi 后端</text>
        <text>Dify 知识库</text>
        <text>第三方模型</text>
      </view>
    </view>

    <view class="form-card">
      <text class="form-title">账号登录</text>
      <text class="form-hint">当前先复用本地开发账号，后续可以平滑切到微信登录或手机号登录。</text>

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

      <button class="primary-btn" :loading="loading" @click="handleLogin">
        {{ loading ? "登录中..." : "进入智能客服" }}
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 40rpx 28rpx 56rpx;
  background:
    radial-gradient(circle at top left, rgba(27, 94, 32, 0.18), transparent 34%),
    radial-gradient(circle at top right, rgba(194, 24, 91, 0.14), transparent 30%),
    linear-gradient(180deg, #f5f7ef 0%, #eef4ff 100%);
}

.login-page {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.hero-card,
.form-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  padding: 32rpx 28rpx;
  box-shadow: 0 24rpx 60rpx rgba(19, 32, 68, 0.08);
}

.hero-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 2rpx;
  color: #4f6b46;
  text-transform: uppercase;
}

.title {
  font-size: 54rpx;
  line-height: 1.12;
  font-weight: 700;
  color: #1b2743;
}

.subtitle,
.form-hint {
  font-size: 28rpx;
  line-height: 1.6;
  color: #4f5872;
}

.stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 10rpx;
}

.stack text {
  padding: 18rpx 20rpx;
  border-radius: 18rpx;
  background: #f1f6ff;
  color: #244061;
  font-size: 24rpx;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.form-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #14213d;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.label {
  font-size: 26rpx;
  color: #31415e;
}

.input {
  height: 92rpx;
  padding: 0 26rpx;
  border-radius: 20rpx;
  background: #f6f8fb;
  font-size: 30rpx;
  color: #17233a;
}

.error {
  font-size: 26rpx;
  color: #c62828;
}

.primary-btn {
  margin-top: 8rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #1f7a4c 0%, #2e90fa 100%);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
