import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

function withBaseStyle(html: string) {
  return html
    .replace(/<p>/g, '<p style="margin:0 0 12px;line-height:1.75;">')
    .replace(/<ul>/g, '<ul style="margin:0 0 12px;padding-left:20px;line-height:1.75;">')
    .replace(/<ol>/g, '<ol style="margin:0 0 12px;padding-left:20px;line-height:1.75;">')
    .replace(/<li>/g, '<li style="margin-bottom:8px;">')
    .replace(/<blockquote>/g, '<blockquote style="margin:0 0 12px;padding-left:12px;border-left:4px solid #bfdbfe;color:#475569;">')
    .replace(/<pre>/g, '<pre style="margin:0 0 12px;padding:16px;border-radius:14px;background:#0f172a;color:#f8fafc;overflow:auto;">')
    .replace(/<code>/g, '<code style="font-size:24rpx;">')
    .replace(/<a /g, '<a style="color:#2563eb;text-decoration:none;" ');
}

export function renderMarkdown(content: string) {
  const html = marked.parse(content || "");
  return withBaseStyle(typeof html === "string" ? html : String(html));
}
