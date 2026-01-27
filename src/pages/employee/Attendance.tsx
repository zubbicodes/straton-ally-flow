import { AttendanceSystem } from '@/components/employee/AttendanceSystemNew';

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Mark your attendance and view your attendance history</p>
      </div>
      <AttendanceSystem />
    </div>
  );
}
