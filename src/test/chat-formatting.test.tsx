import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatLink, formatSelection } from '@/features/chat/composer-format';
import { RichText } from '@/features/chat/format';

describe('chat formatting', () => {
  it('wraps the selected text and preserves the selection for another format', () => {
    const bold = formatSelection('Hello team', 6, 10, 'bold');
    expect(bold).toEqual({ text: 'Hello **team**', start: 8, end: 12 });
    expect(formatSelection(bold.text, bold.start, bold.end, 'italic').text).toBe('Hello **_team_**');
  });

  it('formats multiline lists and rejects unsafe links', () => {
    expect(formatSelection('one\ntwo', 0, 7, 'number').text).toBe('1. one\n2. two');
    expect(formatSelection('run me', 0, 6, 'codeBlock').text).toBe('```\nrun me\n```');
    expect(formatLink('read docs', 5, 9, 'https://example.com').text).toBe('read [docs](https://example.com)');
    expect(() => formatLink('text', 0, 4, 'javascript:alert(1)')).toThrow();
  });

  it('renders the toolbar formats as safe message markup', () => {
    const html = renderToStaticMarkup(<RichText body={'# Heading\n- **bold** and _italic_\n- ++underlined++\n1. [Docs](https://example.com)\n> quoted\n```\nconst a = 1\n```'} byId={new Map()} />);
    expect(html).toContain('<h3');
    expect(html).toContain('<ul');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<u');
    expect(html).toContain('<ol');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('<blockquote');
    expect(html).toContain('<pre');
  });

  it('keeps selected people as mentions when rendering formatted messages', () => {
    const id = '12345678-1234-1234-1234-123456789abc';
    const html = renderToStaticMarkup(<RichText body={`**Hello <@${id}>**`} byId={new Map([[id, { user_id: id, full_name: 'Ali Abbas', email: 'ali@example.com', avatar_url: null, designation: null }]])} />);
    expect(html).toContain('@Ali Abbas');
    expect(html).toContain('<strong>');
  });
});
