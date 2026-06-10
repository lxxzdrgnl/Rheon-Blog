import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// 사설/예약/링크로컬 IP 차단 — SSRF 가드.
// 외부에서 받은 URL을 서버가 대신 fetch하기 전, 호스트가 내부망을 가리키지 않는지 검증한다.

function ipv4ToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return -1;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function inRange(ipLong: number, cidrBase: string, bits: number): boolean {
  const base = ipv4ToLong(cidrBase);
  if (base < 0) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipLong & mask) === (base & mask);
}

function isPrivateIPv4(ip: string): boolean {
  const long = ipv4ToLong(ip);
  if (long < 0) return true; // 파싱 불가 → 안전하게 차단
  return (
    inRange(long, "0.0.0.0", 8) || // "this network"
    inRange(long, "10.0.0.0", 8) || // 사설
    inRange(long, "100.64.0.0", 10) || // CGNAT
    inRange(long, "127.0.0.0", 8) || // 루프백
    inRange(long, "169.254.0.0", 16) || // 링크로컬(클라우드 메타데이터)
    inRange(long, "172.16.0.0", 12) || // 사설
    inRange(long, "192.0.0.0", 24) ||
    inRange(long, "192.168.0.0", 16) || // 사설
    inRange(long, "198.18.0.0", 15) || // 벤치마크
    inRange(long, "224.0.0.0", 4) || // 멀티캐스트
    inRange(long, "240.0.0.0", 4) // 예약
  );
}

function isPrivateIPv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0]; // zone id 제거
  if (addr === "::1" || addr === "::") return true;
  // IPv4-mapped (::ffff:a.b.c.d) → 내부 IPv4 검사
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  // ULA fc00::/7
  if (/^f[cd][0-9a-f]*:/.test(addr)) return true;
  // 링크로컬 fe80::/10
  if (/^fe[89ab][0-9a-f]*:/.test(addr)) return true;
  return false;
}

function isBlockedAddress(addr: string): boolean {
  const ver = isIP(addr);
  if (ver === 4) return isPrivateIPv4(addr);
  if (ver === 6) return isPrivateIPv6(addr);
  return true; // 알 수 없는 형식 → 차단
}

/**
 * URL이 안전(http/https + 공개 IP로 해석)한지 검증한다. 위반 시 throw.
 * 호스트가 도메인이면 DNS로 해석한 모든 주소가 공개 대역인지 확인한다.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw); // 형식 오류면 throw
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Disallowed protocol: ${url.protocol}`);
  }
  const host = url.hostname.replace(/^\[|\]$/g, ""); // IPv6 대괄호 제거
  let addresses: string[];
  if (isIP(host)) {
    addresses = [host];
  } else {
    const resolved = await lookup(host, { all: true });
    addresses = resolved.map((r) => r.address);
    if (addresses.length === 0) throw new Error("DNS resolution failed");
  }
  for (const addr of addresses) {
    if (isBlockedAddress(addr)) throw new Error(`Blocked private address: ${addr}`);
  }
  return url;
}

/**
 * SSRF 안전 fetch. 리다이렉트를 수동으로 따라가며 각 홉마다 호스트를 재검증한다
 * (리다이렉트로 내부망을 노리는 우회를 차단). 위반·과다 리다이렉트 시 throw.
 */
export async function safeFetch(
  rawUrl: string,
  init?: RequestInit,
  maxRedirects = 3,
): Promise<Response> {
  let current = rawUrl;
  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicUrl(current);
    const res = await fetch(current, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}
