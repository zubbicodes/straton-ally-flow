import { TeamCollaboration } from '@/components/employee/TeamCollaboration';

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Collaboration</h1>
        <p className="text-muted-foreground">Connect with your team members and collaborate on projects</p>
      </div>
      <TeamCollaboration />
    </div>
  );
}
