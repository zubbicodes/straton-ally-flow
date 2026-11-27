export type FormatAction =
  | 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'codeBlock'
  | 'quote' | 'bullet' | 'number' | 'heading1' | 'heading2' | 'paragraph';

export interface FormatResult {
  text: string;
  start: number;
  end: number;
}

const WRAPPERS: Partial<Record<FormatAction, string>> = {
  bold: '**', italic: '_', underline: '++', strike: '~~', code: '`',
};

export function formatSelection(text: string, start: number, end: number, action: FormatAction): FormatResult {
  const marker = WRAPPERS[action];
  if (marker) {
    const selected = text.slice(start, end) || 'text';
    const replacement = `${marker}${selected}${marker}`;
    return {
      text: text.slice(0, start) + replacement + text.slice(end),
      start: start + marker.length,
      end: start + marker.length + selected.length,
    };
  }

  if (action === 'codeBlock') {
    const selected = text.slice(start, end) || 'code';
    const before = start > 0 && text[start - 1] !== '\n' ? '\n' : '';
    const after = end < text.length && text[end] !== '\n' ? '\n' : '';
    const replacement = `${before}\`\`\`\n${selected}\n\`\`\`${after}`;
    const selectionStart = start + before.length + 4;
    return { text: text.slice(0, start) + replacement + text.slice(end), start: selectionStart, end: selectionStart + selected.length };
  }

  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const nextNewline = text.indexOf('\n', end);
  const lineEnd = nextNewline < 0 ? text.length : nextNewline;
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split('\n').map((line, index) => {
    const clean = line.replace(/^(?:#{1,3} |>|- |\d+\. )\s?/, '');
    switch (action) {
      case 'quote': return `> ${clean}`;
      case 'bullet': return `- ${clean}`;
      case 'number': return `${index + 1}. ${clean}`;
      case 'heading1': return `# ${clean}`;
      case 'heading2': return `## ${clean}`;
      default: return clean;
    }
  });
  const replacement = lines.join('\n');
  const caret = lineStart + replacement.length;
  return { text: text.slice(0, lineStart) + replacement + text.slice(lineEnd), start: caret, end: caret };
}

export function formatLink(text: string, start: number, end: number, rawUrl: string): FormatResult {
  const url = rawUrl.trim();
  if (!/^https?:\/\/[^\s]+$/i.test(url)) throw new Error('Enter a full http:// or https:// link');
  const label = text.slice(start, end) || 'link text';
  const replacement = `[${label}](${url})`;
  return { text: text.slice(0, start) + replacement + text.slice(end), start: start + 1, end: start + 1 + label.length };
}
