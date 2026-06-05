import { getStoredUser } from "./storage";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_APP_API_BASE ||
  "http://127.0.0.1:8080";

type ApiResponse<T> = {
  code: number;
  msg: string;
  data: T;
};

type RequestOptions = {
  path: string;
  method?: UniApp.RequestOptions["method"];
  data?: Record<string, unknown>;
};

export function request<T>({ path, method = "POST", data }: RequestOptions) {
  const user = getStoredUser();

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${API_BASE}${path}`,
      method,
      data,
      timeout: 30000,
      header: {
        "Content-Type": "application/json",
        ...(user?.token
          ? {
              Authorization: `Bearer ${user.token}`,
            }
          : {}),
      },
      success: (response) => {
        const result = response.data as ApiResponse<T>;
        if (response.statusCode >= 200 && response.statusCode < 300 && result.code === 200) {
          resolve(result.data);
          return;
        }
        reject(new Error(result?.msg || "请求失败"));
      },
      fail: (error) => {
        reject(new Error(error.errMsg || "网络异常"));
      },
    });
  });
}

export { API_BASE };
