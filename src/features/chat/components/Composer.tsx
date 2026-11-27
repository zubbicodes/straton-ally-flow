import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentProps,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { AtSign, Bold, ChevronDown, Code2, Italic, Link2, List, ListOrdered, Mic, Paperclip, Pilcrow, Plus, SendHorizontal, Smile, SquareCode, SquareSlash, Strikethrough, TextQuote, Underline, Video, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addHours } from 'date-fns';
import { formatBytes, namesToTokens, QUICK_EMOJI, tokensToNames } from '../format';
import { formatLink, formatSelection, type FormatAction, type FormatResult } from '../composer-format';
import { useCancelScheduledMessage, useScheduleMessage, useScheduledMessages } from '../api';
import type { DirectoryPerson } from '../types';
import { PersonAvatar } from './PersonAvatar';

/** Pseudo-person so "@assistant" shows up in mention suggestions. Never stored as a mention token. */
const ASSISTANT_PERSON: DirectoryPerson = {
  user_id: 'assistant',
  full_name: 'Assistant',
  email: 'assistant',
  avatar_url: null,
  designation: 'AI · summaries, tasks',
};

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MENTION_QUERY = /(^|\s)@([^\s@][^@\n]{0,30})?$/;

export interface ComposerSubmit {
  body: string;
  mentions: string[];
  files: File[];
}

interface ComposerProps {
  people: DirectoryPerson[];
  placeholder: string;
  onSubmit: (value: ComposerSubmit) => Promise<unknown> | void;
  initialText?: string;
  initialPicked?: DirectoryPerson[];
  allowFiles?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  compact?: boolean;
  channelId?: string;
  parentId?: string | null;
}

export function Composer({
  people,
  placeholder,
  onSubmit,
  initialText = '',
  initialPicked = [],
  allowFiles = true,
  autoFocus = true,
  onCancel,
  submitLabel = 'Send',
  compact,
  channelId,
  parentId,
}: ComposerProps) {
  const [text, setText] = useState(initialText);
  const [files, setFiles] = useState<File[]>([]);
  const [picked, setPicked] = useState(() => new Map(initialPicked.map((p) => [p.user_id, p])));
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [showToolbar, setShowToolbar] = useState(!compact);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [sendAt, setSendAt] = useState(() => format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [recording, setRecording] = useState<'audio' | 'video' | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const scheduled = useScheduledMessages(channelId, parentId);
  const scheduleMessage = useScheduleMessage();
  const cancelScheduled = useCancelScheduledMessage();

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = window.setInterval(() => setRecordingSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const matches = people.filter((p) => p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().startsWith(q)).slice(0, 6);
    return 'assistant'.startsWith(q) ? [ASSISTANT_PERSON, ...matches].slice(0, 6) : matches;
  }, [mentionQuery, people]);

  const updateMentionQuery = (value: string, caret: number) => {
    const match = value.slice(0, caret).match(MENTION_QUERY);
    setMentionQuery(match ? match[2] ?? '' : null);
    setMentionIndex(0);
  };

  const insertAtCaret = (insert: string, replaceBack = 0) => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const next = text.slice(0, caret - replaceBack) + insert + text.slice(caret);
    setText(next);
    const pos = caret - replaceBack + insert.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  const pickMention = (person: DirectoryPerson) => {
    const typed = (mentionQuery ?? '').length + 1; // include "@"
    if (person.user_id === ASSISTANT_PERSON.user_id) {
      insertAtCaret('@assistant ', typed);
      setMentionQuery(null);
      return;
    }
    insertAtCaret(`@${person.full_name} `, typed);
    setPicked((prev) => new Map(prev).set(person.user_id, person));
    setMentionQuery(null);
  };

  const addFiles = (list: FileList | File[]) => {
    const next: File[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 25 MB`);
        continue;
      }
      next.push(file);
    }
    setFiles((prev) => [...prev, ...next].slice(0, 10));
  };

  const applyResult = (result: FormatResult) => {
    setText(result.text);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(result.start, result.end);
    });
  };

  const applyFormat = (action: FormatAction) => {
    const el = textareaRef.current;
    applyResult(formatSelection(text, el?.selectionStart ?? text.length, el?.selectionEnd ?? text.length, action));
  };

  const openLink = () => {
    const el = textareaRef.current;
    selectionRef.current = { start: el?.selectionStart ?? text.length, end: el?.selectionEnd ?? text.length };
    setLinkUrl('https://');
    setLinkOpen(true);
  };

  const insertLink = () => {
    try {
      const { start, end } = selectionRef.current;
      applyResult(formatLink(text, start, end, linkUrl));
      setLinkOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid link');
    }
  };

  const startRecording = async (kind: 'audio' | 'video') => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Recording is not available in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === 'video' ? { audio: true, video: true } : { audio: true });
      const candidates = kind === 'video' ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRecordingRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
        if (chunksRef.current.reduce((total, chunk) => total + chunk.size, 0) > MAX_FILE_BYTES) {
          discardRecordingRef.current = true;
          toast.error('Recording reached the 25 MB attachment limit');
          recorder.stop();
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (!discardRecordingRef.current && blob.size > 0) {
          const extension = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
          addFiles([new File([blob], `${kind}-clip-${Date.now()}.${extension}`, { type: recorder.mimeType })]);
        }
        recorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];
        setRecording(null);
      };
      recorder.start(1000);
      setRecording(kind);
      setRecordingSeconds(0);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      toast.error(error instanceof Error ? error.message : 'Could not start recording');
    }
  };

  const stopRecording = (discard = false) => {
    discardRecordingRef.current = discard;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const schedule = async () => {
    if (!channelId || !text.trim() || files.length > 0) return;
    const date = new Date(sendAt);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now() + 60_000) {
      toast.error('Choose a time at least one minute from now');
      return;
    }
    const { body, mentions } = namesToTokens(text.trim(), picked);
    try {
      await scheduleMessage.mutateAsync({ channelId, parentId, body, mentions, sendAt: date.toISOString() });
      setText('');
      setPicked(new Map());
      setScheduleOpen(false);
      toast.success(`Message scheduled for ${format(date, 'd MMM, h:mm a')}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not schedule message');
    }
  };

  const openSchedule = () => {
    if (new Date(sendAt).getTime() <= Date.now() + 60_000) {
      setSendAt(format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
    }
    void scheduled.refetch();
    setScheduleOpen(true);
  };

  const submit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || sending || recording) return;
    const { body, mentions } = namesToTokens(trimmed, picked);
    const pendingFiles = files;
    setSending(true);
    // Clear immediately so sending feels instant; restore on failure.
    setText('');
    setFiles([]);
    try {
      await onSubmit({ body, mentions, files: pendingFiles });
      setPicked(new Map());
    } catch (error) {
      setText(trimmed);
      setFiles(pendingFiles);
      toast.error(error instanceof Error ? error.message : 'Message not sent');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
      const action = ({ b: 'bold', i: 'italic', u: 'underline' } as const)[event.key.toLowerCase() as 'b' | 'i' | 'u'];
      if (action) {
        event.preventDefault();
        applyFormat(action);
        return;
      }
    }
    if (suggestions.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        setMentionIndex((i) => (i + delta + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        pickMention(suggestions[mentionIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
    if (event.key === 'Escape' && onCancel) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!allowFiles) return;
    if (event.clipboardData.files.length > 0) {
      event.preventDefault();
      addFiles(event.clipboardData.files);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!allowFiles) return;
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  };

  const canSend = (text.trim().length > 0 || files.length > 0) && !sending && !recording;

  return (
    <div
      className={cn(
        'relative rounded-lg border border-border bg-card transition-colors focus-within:border-ring/60',
        dragging && 'border-primary bg-primary/5',
      )}
      onDragOver={(e) => {
        if (!allowFiles) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {suggestions.length > 0 ? (
        <div
          role="listbox"
          aria-label="Mention someone"
          className="absolute bottom-full left-2 z-20 mb-1 w-72 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {suggestions.map((person, index) => (
            <button
              key={person.user_id}
              type="button"
              role="option"
              aria-selected={index === mentionIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                pickMention(person);
              }}
              onMouseEnter={() => setMentionIndex(index)}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px]',
                index === mentionIndex && 'bg-accent text-accent-foreground',
              )}
            >
              <PersonAvatar person={person} assistant={person.user_id === ASSISTANT_PERSON.user_id} className="h-5 w-5 rounded" />
              <span className="truncate font-medium">{person.full_name}</span>
              <span className="ml-auto truncate text-[11px] text-muted-foreground">{person.designation}</span>
            </button>
          ))}
        </div>
      ) : null}

      {showToolbar ? (
        <div role="toolbar" aria-label="Message formatting" className="flex items-center gap-0.5 overflow-x-auto border-b border-border/70 px-1.5 py-1">
          <ComposerIconButton label="Bold (Ctrl+B)" onClick={() => applyFormat('bold')}><Bold className="h-4 w-4" /></ComposerIconButton>
          <ComposerIconButton label="Italic (Ctrl+I)" onClick={() => applyFormat('italic')}><Italic className="h-4 w-4" /></ComposerIconButton>
          <ComposerIconButton label="Underline (Ctrl+U)" onClick={() => applyFormat('underline')}><Underline className="h-4 w-4" /></ComposerIconButton>
          <ComposerIconButton label="Strikethrough" onClick={() => applyFormat('strike')}><Strikethrough className="h-4 w-4" /></ComposerIconButton>
          <DropdownMenu>
              <DropdownMenuTrigger asChild><ComposerIconButton label="Text style" className="flex h-7 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pilcrow className="h-4 w-4" /><ChevronDown className="h-3 w-3" /></ComposerIconButton></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => applyFormat('paragraph')}>Paragraph</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => applyFormat('heading1')}>Heading</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => applyFormat('heading2')}>Subheading</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="mx-1 h-4 w-px shrink-0 bg-border" />
          <ComposerIconButton label="Insert link" onClick={openLink}><Link2 className="h-4 w-4" /></ComposerIconButton>
          <ComposerIconButton label="Numbered list" onClick={() => applyFormat('number')}><ListOrdered className="h-4 w-4" /></ComposerIconButton>
          <ComposerIconButton label="Bulleted list" onClick={() => applyFormat('bullet')}><List className="h-4 w-4" /></ComposerIconButton>
          <span className="mx-1 h-4 w-px shrink-0 bg-border" />
          <ComposerIconButton label="Quote" onClick={() => applyFormat('quote')}><TextQuote className="h-4 w-4" /></ComposerIconButton>
          <ComposerIconButton label="Inline code" onClick={() => applyFormat('code')}><Code2 className="h-4 w-4" /></ComposerIconButton>
          <ComposerIconButton label="Code block" onClick={() => applyFormat('codeBlock')}><SquareCode className="h-4 w-4" /></ComposerIconButton>
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-b border-border px-2 pb-2 pt-2">
          {files.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="flex max-w-[220px] items-center gap-1.5 rounded-md border border-border bg-muted/50 py-1 pl-2 pr-1 text-[12px]"
            >
              <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={text}
        rows={1}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          updateMentionQuery(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => setTimeout(() => { if (document.activeElement !== textareaRef.current) setMentionQuery(null); }, 150)}
        className={cn(
          'block w-full resize-none bg-transparent px-3 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground',
          compact ? 'py-2' : 'py-2.5',
        )}
      />

      {recording ? (
        <div className="mx-2 mb-2 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[12px]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          <span className="font-medium">Recording {recording} clip · {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
          <button type="button" onClick={() => stopRecording()} className="ml-auto font-medium text-primary hover:underline">Stop and attach</button>
          <button type="button" onClick={() => stopRecording(true)} className="text-muted-foreground hover:underline">Discard</button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-0.5 gap-y-1 px-1.5 pb-1.5">
        {allowFiles ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild><ComposerIconButton label="Add attachment"><Plus className="h-4 w-4" /></ComposerIconButton></DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                <DropdownMenuItem onSelect={() => { if (fileInputRef.current) { fileInputRef.current.accept = ''; fileInputRef.current.click(); } }}><Paperclip className="mr-2 h-4 w-4" />Upload a file</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); } }}>Upload an image</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
        <ComposerIconButton label={showToolbar ? 'Hide formatting' : 'Show formatting'} aria-pressed={showToolbar} onClick={() => setShowToolbar((value) => !value)}>
          <span className="text-[15px] font-medium underline underline-offset-4">Aa</span>
        </ComposerIconButton>
        <Popover>
          <PopoverTrigger asChild>
            <ComposerIconButton label="Insert emoji">
              <Smile className="h-4 w-4" />
            </ComposerIconButton>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-auto p-1.5">
            <div className="grid grid-cols-6 gap-0.5">
              {QUICK_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertAtCaret(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-muted"
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <ComposerIconButton label="Mention someone" onClick={() => { insertAtCaret('@'); setMentionQuery(''); }}><AtSign className="h-4 w-4" /></ComposerIconButton>
        {allowFiles ? (
          <>
            <span className="mx-1 h-4 w-px bg-border" />
            <ComposerIconButton label="Record video clip" disabled={Boolean(recording)} onClick={() => void startRecording('video')}><Video className="h-4 w-4" /></ComposerIconButton>
            <ComposerIconButton label="Record voice clip" disabled={Boolean(recording)} onClick={() => void startRecording('audio')}><Mic className="h-4 w-4" /></ComposerIconButton>
          </>
        ) : null}
        <span className="mx-1 h-4 w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><ComposerIconButton label="Chat shortcuts"><SquareSlash className="h-4 w-4" /></ComposerIconButton></DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem onSelect={() => insertAtCaret('@assistant ')}>Ask the assistant</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => applyFormat('quote')}>Insert quote</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => applyFormat('codeBlock')}>Insert code block</DropdownMenuItem>
            {allowFiles ? <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => { if (fileInputRef.current) { fileInputRef.current.accept = ''; fileInputRef.current.click(); } }}>Attach a file</DropdownMenuItem></> : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto flex items-center gap-1">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="h-7 rounded-md px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSend}
            aria-label={submitLabel}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors',
              canSend ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground',
            )}
          >
            {onCancel ? submitLabel : <SendHorizontal className="h-3.5 w-3.5" />}
          </button>
          {channelId && !onCancel ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><ComposerIconButton label="Send options"><ChevronDown className="h-3.5 w-3.5" /></ComposerIconButton></DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem disabled={!text.trim() || files.length > 0 || Boolean(recording)} onSelect={openSchedule}>Schedule message…</DropdownMenuItem>
                <DropdownMenuItem onSelect={openSchedule}>View scheduled messages{scheduled.data?.length ? ` (${scheduled.data.length})` : ''}</DropdownMenuItem>
                {files.length > 0 ? <p className="max-w-52 px-2 py-1 text-[11px] text-muted-foreground">Attachments and clips can only be sent now.</p> : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Insert link</DialogTitle><DialogDescription>Add a web address to the selected text.</DialogDescription></DialogHeader>
          <input autoFocus type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') insertLink(); }} aria-label="Link URL" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <DialogFooter><button type="button" onClick={insertLink} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Insert link</button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Schedule a message</DialogTitle><DialogDescription>It will send from your account at the selected local time, even if you close this page.</DialogDescription></DialogHeader>
          <label className="space-y-1 text-sm font-medium">Send at
            <input type="datetime-local" value={sendAt} onChange={(event) => setSendAt(event.target.value)} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <button type="button" onClick={() => void schedule()} disabled={!text.trim() || files.length > 0 || Boolean(recording) || scheduleMessage.isPending} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{scheduleMessage.isPending ? 'Scheduling…' : 'Schedule current message'}</button>
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scheduled in this conversation</p>
            {scheduled.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : scheduled.data?.length ? (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {scheduled.data.map((message) => <div key={message.id} className="flex items-start gap-2 rounded-md border border-border p-2 text-sm">
                  <div className="min-w-0 flex-1"><p className="truncate">{tokensToNames(message.body, new Map(people.map((person) => [person.user_id, person])))}</p><p className="text-xs text-muted-foreground">{message.status === 'failed' ? message.last_error ?? 'Could not send' : format(new Date(message.send_at), 'd MMM, h:mm a')}</p></div>
                  <button type="button" onClick={() => cancelScheduled.mutate(message, { onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not cancel') })} disabled={cancelScheduled.isPending} aria-label="Cancel scheduled message" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>)}
              </div>
            ) : <p className="text-sm text-muted-foreground">No scheduled messages.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ComposerIconButton = forwardRef<HTMLButtonElement, { label: string; children: ReactNode } & ComponentProps<'button'>>(
  ({ label, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  ),
);
ComposerIconButton.displayName = 'ComposerIconButton';
