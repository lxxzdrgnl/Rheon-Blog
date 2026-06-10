import { AsyncLocalStorage } from "node:async_hooks";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";

// 이미 인증된 비-쿠키 경로(예: Bearer 검증을 마친 MCP 라우트)에서 가드된 서버 액션을
// 그대로 재사용할 수 있도록, 요청 범위(request-scoped)로 "관리자 권한 보유" 플래그를 전달한다.
// 모듈 전역 변수가 아닌 AsyncLocalStorage를 쓰는 이유는 동시 요청 간 플래그가 새지 않게 하기 위함.
const adminContext = new AsyncLocalStorage<boolean>();

/** 콜백을 "관리자 권한 보유" 컨텍스트에서 실행한다. 이미 별도 수단으로 인증을 마친 경우에만 사용. */
export function runAsAdmin<T>(fn: () => Promise<T>): Promise<T> {
  return adminContext.run(true, fn);
}

/**
 * 변경(쓰기) 서버 액션 보호용. 프록시는 경로 프리픽스(/my·/api)만 가드하므로,
 * 공개 경로로 직접 POST될 수 있는 Server Action은 이 함수로 액션 내부에서 인증을 재검증해야 한다.
 * runAsAdmin 컨텍스트(이미 인증됨) 안이면 통과, 아니면 access_token 쿠키를 검증한다.
 * 인증 실패 시 throw하여 액션 실행을 중단시킨다.
 */
export async function requireAdmin() {
  if (adminContext.getStore() === true) return;
  const token = (await cookies()).get("access_token")?.value;
  if (!token || !(await verifyAccessToken(token))) throw new Error("Unauthorized");
}
