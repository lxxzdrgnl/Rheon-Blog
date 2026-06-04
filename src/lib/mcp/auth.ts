/** Authorization 헤더가 `Bearer <token>` 형태이며 서버 토큰과 정확히 일치하는지 검증. */
export function verifyBearer(authHeader: string | null, serverToken: string | undefined): boolean {
  if (!serverToken) return false; // 미설정 시 전면 거부 (실수로 열리는 것 방지)
  if (!authHeader) return false;
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) return false;
  const provided = authHeader.slice(prefix.length);
  // 길이 다르면 즉시 false (timing-safe까지는 1인용이라 불필요)
  return provided.length === serverToken.length && provided === serverToken;
}
