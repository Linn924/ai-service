import { request } from "@/utils/request";
import type { LoginUser } from "@/utils/storage";

export function login(data: { username: string; password: string }) {
  return request<LoginUser>({
    path: "/api/auth/login",
    data,
  });
}
