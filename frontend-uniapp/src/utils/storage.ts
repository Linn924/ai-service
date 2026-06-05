const USER_KEY = "ai-cs-user";

export type LoginUser = {
  token: string;
  username: string;
  displayName: string;
};

export function getStoredUser() {
  return uni.getStorageSync(USER_KEY) as LoginUser | null;
}

export function setStoredUser(user: LoginUser) {
  uni.setStorageSync(USER_KEY, user);
}

export function clearStoredUser() {
  uni.removeStorageSync(USER_KEY);
}
