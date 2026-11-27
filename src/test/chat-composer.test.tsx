import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from '@/features/chat/components/Composer';

vi.mock('@/features/chat/api', () => ({
  useScheduledMessages: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useScheduleMessage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelScheduledMessage: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('chat composer', () => {
  it('formats selected text and sends its stored Markdown', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<Composer people={[]} placeholder="Message Ali Abbas" initialText="Hello team" onSubmit={onSubmit} channelId="channel-id" autoFocus={false} />);

    const input = screen.getByRole('textbox', { name: 'Message Ali Abbas' }) as HTMLTextAreaElement;
    input.setSelectionRange(6, 10);
    fireEvent.click(screen.getByRole('button', { name: 'Bold (Ctrl+B)' }));
    expect(input.value).toBe('Hello **team**');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });
    expect(onSubmit).toHaveBeenCalledWith({ body: 'Hello **team**', mentions: [], files: [] });
  });
});
