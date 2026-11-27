import { Fragment, type ReactNode } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import type { ChannelSummary, DirectoryPerson } from './types';

export const MENTION_TOKEN = /<@([0-9a-f-]{36})>/g;
export const QUICK_EMOJI = ['👍', '❤️', '😂', '🎉', '👀', '🙏', '✅', '🔥', '😮', '😢', '💯', '🚀'];

/** Replace `<@uuid>` tokens with `@Name` for editing and plain previews. */
export function tokensToNames(body: string, byId: Map<string, DirectoryPerson>) {
  return body.replace(MENTION_TOKEN, (_m, id: string) => `@${byId.get(id)?.full_name ?? 'someone'}`);
}

/** Turn `@Full Name` back into `<@uuid>` for every person the composer picked. */
export function namesToTokens(text: string, picked: Map<string, DirectoryPerson>) {
  let body = text;
  const mentions: string[] = [];
  // longest names first so "@Ali Khan" wins over "@Ali"
  const people = [...picked.values()].sort((a, b) => b.full_name.length - a.full_name.length);
  for (const person of people) {
    const needle = `@${person.full_name}`;
    if (body.includes(needle)) {
      body = body.split(needle).join(`<@${person.user_id}>`);
      mentions.push(person.user_id);
    }
  }
  return { body, mentions };
}

export function channelLabel(channel: Pick<ChannelSummary, 'kind' | 'name' | 'dm_user_ids'>, byId: Map<string, DirectoryPerson>, meId?: string) {
  if (channel.kind !== 'dm') return channel.name ?? 'channel';
  const others = (channel.dm_user_ids ?? []).filter((id) => id !== meId);
  if (others.length === 0) return 'Just you';
  return others.map((id) => byId.get(id)?.full_name ?? 'Unknown').join(', ');
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, d MMMM');
}

export function timeLabel(iso: string) {
  return format(new Date(iso), 'h:mm a');
}

export function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const INLINE = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\+\+[^+\n]+\+\+)|(~~[^~\n]+~~)|(?<![\w])_([^_\n]+)_(?![\w])|<@([0-9a-f-]{36})>|(https?:\/\/[^\s<]+[^\s<.,:;"')\]])/g;

function renderInline(text: string, byId: Map<string, DirectoryPerson>, meId: string | undefined, keyBase: string, depth = 0): ReactNode[] {
  if (depth > 4) return [text];
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyBase}-${i++}`;
    const [whole, linked, linkLabel, linkUrl, code, bold, underline, strike, italic, mention, url] = match;
    if (linked) {
      out.push(<a key={key} href={linkUrl} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-2 hover:no-underline">{linkLabel}</a>);
    } else if (code) {
      out.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">
          {code.slice(1, -1)}
        </code>,
      );
    } else if (bold) {
      out.push(<strong key={key}>{renderInline(bold.slice(2, -2), byId, meId, key, depth + 1)}</strong>);
    } else if (underline) {
      out.push(<u key={key} className="underline-offset-2">{renderInline(underline.slice(2, -2), byId, meId, key, depth + 1)}</u>);
    } else if (strike) {
      out.push(<s key={key}>{renderInline(strike.slice(2, -2), byId, meId, key, depth + 1)}</s>);
    } else if (italic) {
      out.push(<em key={key}>{renderInline(italic, byId, meId, key, depth + 1)}</em>);
    } else if (mention) {
      const person = byId.get(mention);
      out.push(
        <span
          key={key}
          className={
            mention === meId
              ? 'rounded bg-amber-500/15 px-0.5 font-medium text-amber-700 dark:text-amber-300'
              : 'rounded bg-primary/10 px-0.5 font-medium text-primary'
          }
        >
          @{person?.full_name ?? 'someone'}
        </span>,
      );
    } else if (url) {
      out.push(
        <a key={key} href={url} target="_blank" rel="noreferrer noopener" className="text-primary underline-offset-2 hover:underline">
          {url}
        </a>,
      );
    } else {
      out.push(whole);
    }
    last = start + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderTextBlocks(text: string, byId: Map<string, DirectoryPerson>, meId: string | undefined, keyBase: string): ReactNode[] {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      if (index < lines.length - 1) blocks.push(<div key={`${keyBase}-${index}`} className="h-2" />);
      index += 1;
      continue;
    }
    const heading = /^(#{1,2}) (.*)$/.exec(line);
    if (heading) {
      const content = renderInline(heading[2], byId, meId, `${keyBase}-${index}`);
      blocks.push(heading[1].length === 1
        ? <h3 key={`${keyBase}-${index}`} className="font-semibold text-[1.15em]">{content}</h3>
        : <h4 key={`${keyBase}-${index}`} className="font-semibold">{content}</h4>);
      index += 1;
      continue;
    }
    const listKind = /^(- |\d+\. )/.exec(line)?.[0];
    if (listKind) {
      const numbered = listKind !== '- ';
      const items: ReactNode[] = [];
      while (index < lines.length && (numbered ? /^\d+\. / : /^- /).test(lines[index])) {
        items.push(<li key={index}>{renderInline(lines[index].replace(numbered ? /^\d+\. / : /^- /, ''), byId, meId, `${keyBase}-${index}`)}</li>);
        index += 1;
      }
      blocks.push(numbered
        ? <ol key={`${keyBase}-${index}`} className="my-1 list-decimal pl-5">{items}</ol>
        : <ul key={`${keyBase}-${index}`} className="my-1 list-disc pl-5">{items}</ul>);
      continue;
    }
    if (line.startsWith('> ')) {
      const quoteLines: ReactNode[] = [];
      while (index < lines.length && lines[index].startsWith('> ')) {
        quoteLines.push(<Fragment key={index}>{index > 0 && quoteLines.length > 0 ? <br /> : null}{renderInline(lines[index].slice(2), byId, meId, `${keyBase}-${index}`)}</Fragment>);
        index += 1;
      }
      blocks.push(<blockquote key={`${keyBase}-${index}`} className="my-1 border-l-2 border-border pl-2 text-muted-foreground">{quoteLines}</blockquote>);
      continue;
    }
    const paragraph: ReactNode[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,2} |\d+\. |- |> )/.test(lines[index])) {
      if (paragraph.length) paragraph.push(<br key={`${index}-br`} />);
      paragraph.push(<Fragment key={index}>{renderInline(lines[index], byId, meId, `${keyBase}-${index}`)}</Fragment>);
      index += 1;
    }
    blocks.push(<p key={`${keyBase}-${index}`}>{paragraph}</p>);
  }
  return blocks;
}

/** Safe Markdown subset shared by plain, thread, and edited messages. */
export function RichText({ body, byId, meId }: { body: string; byId: Map<string, DirectoryPerson>; meId?: string }) {
  const parts = body.split(/```(?:[a-z]*\n)?([\s\S]*?)```/g);
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <pre key={index} className="my-1 overflow-x-auto rounded-md border border-border bg-muted/60 p-2 font-mono text-[12px] leading-relaxed">
              {part.replace(/\n$/, '')}
            </pre>
          );
        }
        return <Fragment key={index}>{renderTextBlocks(part, byId, meId, String(index))}</Fragment>;
      })}
    </>
  );
}
