import { Chat } from '@/components/employee/Chat';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Chat</h1>
        <p className="text-muted-foreground">Communicate with your team members in real-time</p>
      </div>
      <Chat />
    </div>
  );
}
