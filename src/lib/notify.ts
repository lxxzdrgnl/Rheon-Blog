// 새 댓글/답글 시 디스코드로 알림(운영자용). DISCORD_WEBHOOK_URL 미설정이면 no-op.
export async function notifyNewComment(c: {
  nickname: string;
  content: string;
  parentId: number | null;
  postTitle: string;
  url: string;
}) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;
  const kind = c.parentId ? "답글" : "댓글";
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `새 ${kind} — ${c.postTitle}`.slice(0, 250),
            description: c.content.slice(0, 1500),
            url: c.url,
            author: { name: c.nickname.slice(0, 80) },
            color: 0x22c55e,
          },
        ],
      }),
    });
  } catch {
    // 알림 실패가 댓글 작성을 막지 않도록 무시
  }
}
