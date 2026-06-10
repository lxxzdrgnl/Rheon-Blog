// <script> 컨텍스트 탈출 방지: JSON.stringify는 <, >, & 를 이스케이프하지 않으므로
// 본문 값에 "</script>"(또는 "<!--")가 들어가면 스크립트 블록을 탈출할 수 있다.
// 이들을 유니코드 이스케이프하면 JSON 의미는 보존되면서 HTML 파서가 태그로 오인하지 않는다.
export function jsonLdSafe(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

// schema.org JSON-LD를 <script>로 렌더(서버 컴포넌트). 객체 1개 또는 배열 허용.
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(d) }} />
      ))}
    </>
  );
}
