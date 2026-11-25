/** Keep plain imported text from becoming HTML, embeds, links or Markdown structure. */
export function escapeMarkdownText(value: string): string {
  return value.replace(/[\\`*_[\]<>!|#$~=]/g, '\\$&');
}

export function markdownInlineText(value: string): string {
  return escapeMarkdownText(value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim());
}
