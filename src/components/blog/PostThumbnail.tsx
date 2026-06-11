"use client";

// 폴백 커버 텍스처 — SVG를 인코딩해 배경 패턴으로. 제목 해시로 골라 다양성 확보.
const px = (size: number, inner: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg width='${size}' height='${size}' xmlns='http://www.w3.org/2000/svg'>${inner}</svg>`)}")`;

const PATTERNS = [
  px(40, `<path d='M0 40L40 0M-10 10L10-10M30 50L50 30' stroke='#fff' stroke-width='1' opacity='0.07'/>`),        // 대각선
  px(48, `<circle cx='24' cy='24' r='8' fill='none' stroke='#fff' stroke-width='0.8' opacity='0.06'/>`),          // 원
  px(32, `<path d='M16 8v16M8 16h16' stroke='#fff' stroke-width='0.8' opacity='0.06'/>`),                         // 플러스
  px(20, `<circle cx='10' cy='10' r='1.2' fill='#fff' opacity='0.08'/>`),                                         // 점
  px(44, `<path d='M0 22h44M22 0v44' stroke='#fff' stroke-width='0.6' opacity='0.05'/>`),                         // 격자
  px(40, `<path d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='#fff' stroke-width='0.7' opacity='0.05'/>`),      // 다이아몬드
  px(36, `<path d='M0 27L9 18L18 27L27 18L36 27' fill='none' stroke='#fff' stroke-width='0.8' opacity='0.06'/>`), // 지그재그
  px(30, `<path d='M0 0L30 30M30 0L0 30' stroke='#fff' stroke-width='0.5' opacity='0.045'/>`),                    // 크로스해치
  px(36, `<rect x='12' y='12' width='12' height='12' fill='none' stroke='#fff' stroke-width='0.7' opacity='0.05'/>`), // 사각
  px(48, `<circle cx='0' cy='0' r='2.2' fill='#fff' opacity='0.05'/><circle cx='24' cy='24' r='2.2' fill='#fff' opacity='0.05'/><circle cx='48' cy='48' r='2.2' fill='#fff' opacity='0.05'/><circle cx='0' cy='48' r='2.2' fill='#fff' opacity='0.05'/><circle cx='48' cy='0' r='2.2' fill='#fff' opacity='0.05'/>`), // 큰 점
  px(28, `<path d='M14 3L23 8.5V19.5L14 25L5 19.5V8.5Z' fill='none' stroke='#fff' stroke-width='0.6' opacity='0.05'/>`), // 육각
  px(36, `<path d='M0 18Q9 9 18 18T36 18' fill='none' stroke='#fff' stroke-width='0.8' opacity='0.055'/>`),        // 물결
  px(24, `<path d='M0 12h24M12 0v24' stroke='#fff' stroke-width='0.5' opacity='0.04'/><circle cx='12' cy='12' r='1' fill='#fff' opacity='0.06'/>`), // 격자+점
  px(50, `<path d='M25 0v50M0 25h50' stroke='#fff' stroke-width='0.5' opacity='0.035'/><path d='M0 0L50 50M50 0L0 50' stroke='#fff' stroke-width='0.4' opacity='0.03'/>`), // 미세 그리드+대각
];

const GRADIENTS = [
  "from-[#1a2e28] to-[#243832]", // teal-green
  "from-[#1e2226] to-[#282d31]", // slate
  "from-[#1c2030] to-[#262a38]", // blue
  "from-[#2a2520] to-[#332e28]", // warm brown
  "from-[#261e22] to-[#30272b]", // plum
  "from-[#1b2528] to-[#252f32]", // teal-gray
  "from-[#22202e] to-[#2c2a3a]", // indigo
  "from-[#102420] to-[#1a302a]", // deep green
  "from-[#2a1e26] to-[#342832]", // wine
  "from-[#1e2a2e] to-[#283438]", // steel cyan
  "from-[#2a2418] to-[#342e22]", // olive amber
  "from-[#201e28] to-[#2a2834]", // muted violet
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 대략적인 글자폭(em): 라틴/숫자/공백 ~0.56, CJK 등 ~1.0
function approxWidthEm(text: string) {
  let w = 0;
  for (const ch of text) w += /[ -ÿ]/.test(ch) ? 0.56 : 1;
  return Math.max(w, 0.6);
}

/**
 * 커버 글자를 16:10 안에 가장 크게 채우도록 라인으로 묶고 SVG 좌표를 계산한다.
 * 폴백 커버와 이미지 오버레이가 공용으로 사용 — 가운데 정렬 자동 맞춤.
 */
function layoutTitle(coverText: string, wrap: boolean) {
  // 공백뿐 아니라 가운뎃점(· · ‧) 뒤에서도 줄바꿈을 허용한다. "RateLimiter·스레드·UPSERT"
  // 같은 긴 합성어가 한 줄을 과도하게 넓혀 글자가 작아지는 문제를 완화 — ·는 앞 토큰에 붙여 유지.
  const words = coverText.split(/(?<=[·・‧])|\s+/).filter(Boolean);
  const SPACE_EM = 0.3;
  const LINE_H = 1.12; // em
  const COVER_RATIO = 1.6; // 커버 16:10 내부 가로/세로 비

  let lines: string[];
  if (!wrap || words.length <= 1) {
    lines = [coverText];
  } else {
    const wordsW = words.map(approxWidthEm);
    const totalW = wordsW.reduce((a, b) => a + b, 0) + (words.length - 1) * SPACE_EM;
    const packAt = (targetW: number): string[] => {
      const out: string[] = [];
      let cur = "";
      let curW = 0;
      for (let i = 0; i < words.length; i++) {
        if (cur === "") { cur = words[i]; curW = wordsW[i]; }
        else if (curW + SPACE_EM + wordsW[i] <= targetW) { cur += " " + words[i]; curW += SPACE_EM + wordsW[i]; }
        else { out.push(cur); cur = words[i]; curW = wordsW[i]; }
      }
      if (cur) out.push(cur);
      return out;
    };
    let best = [coverText];
    let bestScale = -1;
    for (let L = 1; L <= words.length; L++) {
      const cand = packAt(totalW / L);
      const maxW = Math.max(...cand.map(approxWidthEm));
      const h = cand.length * LINE_H;
      const scale = Math.min(COVER_RATIO / maxW, 1 / h);
      if (scale > bestScale) { bestScale = scale; best = cand; }
    }
    lines = best;
  }

  const FS = 100;
  const lineH = FS * 1.12;
  const vbW = Math.max(...lines.map(approxWidthEm)) * FS;
  const vbH = lines.length * lineH;
  const pad = FS * 0.1;
  const viewBox = `${-pad} ${-pad} ${vbW + pad * 2} ${vbH + pad * 2}`;
  return { lines, viewBox, vbW, lineH, FS };
}

/**
 * 가운데 정렬 자동 맞춤 제목 SVG. shadow=true면 이미지 위 가독성용 그림자.
 * 폴백 커버와 이미지 오버레이가 **동일하게** 이 함수를 쓴다 — 표시 글자 수(textLength)
 * 계산까지 여기 한 곳에 두어 두 경우의 로직이 절대 어긋나지 않게 한다.
 */
function CenteredTitle({ title, textLength, wrap, coverFont, shadow }: { title: string; textLength?: number | null; wrap: boolean; coverFont: "serif" | "sans"; shadow?: boolean }) {
  const coverText = title.slice(0, textLength || 8).trim();
  const { lines, viewBox, vbW, lineH, FS } = layoutTitle(coverText, wrap);
  const padClass = wrap ? "p-[6%]" : "p-[10%]";
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${padClass}`}>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={shadow ? { filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.7)) drop-shadow(0 1px 2px rgba(0,0,0,0.5))" } : undefined}
      >
        {/* dominant-baseline 대신 baseline을 직접 계산 — Safari/WebKit 호환 */}
        <text
          textAnchor="middle"
          fontSize={FS}
          className={`fill-white font-black ${coverFont === "serif" ? "font-serif" : ""}`}
          style={{ letterSpacing: "-0.03em", ...(coverFont === "sans" ? { fontFamily: "var(--font-family-sans)" } : {}) }}
        >
          {lines.map((ln, i) => (
            <tspan key={i} x={vbW / 2} y={i * lineH + FS * 0.8}>{ln}</tspan>
          ))}
        </text>
      </svg>
    </div>
  );
}

interface PostThumbnailProps {
  thumbnail: string | null;
  title: string;
  /** 그라데이션 폴백 커버에 표시할 글자 수 (기본 8) */
  textLength?: number | null;
  /** 폴백 커버 글자 폰트 (기본 sans) */
  coverFont?: "serif" | "sans";
  /** 공백 기준 줄바꿈으로 글자를 크게 채움 (기본 true). false면 한 줄. */
  wrap?: boolean;
  /** 이미지 썸네일 위에 제목을 가운데 오버레이로 표시 (가독성용 그림자 자동). 이미지가 있을 때만 적용. */
  titleOverlay?: boolean;
  className?: string;
}

/**
 * 포스트·프로젝트 공용 커버.
 * - thumbnail 있으면 이미지. titleOverlay면 그 위에 제목을 가운데 큰 글씨로 오버레이.
 * - 없으면 그라데이션 + 제목 글자(폴백 커버).
 * 두 경우 모두 같은 가운데 자동 맞춤 렌더링을 공용으로 쓴다.
 */
export function PostThumbnail({ thumbnail, title, textLength, coverFont = "sans", wrap = true, titleOverlay = false, className = "" }: PostThumbnailProps) {
  if (thumbnail) {
    return (
      <div className={`relative aspect-[16/10] overflow-hidden rounded-xl bg-bg-card ${className}`}>
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
        {titleOverlay && title ? (
          <>
            {/* 가독성용 옅은 막 — 글자 그림자가 주 가독성, 막은 보조라 과하지 않게 */}
            <div className="absolute inset-0 bg-black/20" />
            <CenteredTitle title={title} textLength={textLength} wrap={wrap} coverFont={coverFont} shadow />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.06] pointer-events-none" />
      </div>
    );
  }

  const hash = hashString(title);
  // 그라데이션과 패턴을 서로 다른 비트로 골라 조합이 겹치지 않게 한다.
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  const pattern = PATTERNS[Math.floor(hash / GRADIENTS.length) % PATTERNS.length];

  return (
    <div className={`relative aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      <div className="absolute inset-0" style={{ backgroundImage: pattern }} />
      <div className="absolute -bottom-1/3 -right-1/4 w-2/3 h-2/3 rounded-full bg-white/[0.04] blur-2xl" />
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-white/[0.03] blur-3xl" />
      <CenteredTitle title={title} textLength={textLength} wrap={wrap} coverFont={coverFont} />
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.08] pointer-events-none" />
    </div>
  );
}
