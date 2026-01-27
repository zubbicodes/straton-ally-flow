import { Notifications } from '@/components/employee/Notifications';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with latest announcements and updates</p>
      </div>
      <Notifications />
    </div>
  );
}
