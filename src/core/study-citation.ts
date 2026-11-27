import { markdownInlineText } from "./markdown-text";

export interface CitationAddress { module: string; entry: string; source?: string }
export const CITATION_ACTION = "sworddock-cite";

export function parseCitationAddress(params: Record<string, string>): CitationAddress | null {
  const { module, entry, source } = params;
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(module ?? "") || !entry || entry.length > 2048 ||
    /[\u0000-\u001f\u007f]/.test(entry) || (source !== undefined && !/^[a-f0-9]{64}$/.test(source))) return null;
  return { module, entry, ...(source === undefined ? {} : { source }) };
}

export function citationMarkdown(vault: string, label: string, address: CitationAddress): string {
  const query = new URLSearchParams({ vault, ...address });
  return "[" + markdownInlineText(label) + "](obsidian://" + CITATION_ACTION + "?" + query + ")";
}
