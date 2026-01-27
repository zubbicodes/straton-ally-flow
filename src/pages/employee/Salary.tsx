import { SalaryProgress } from '@/components/employee/SalaryProgress';

export default function SalaryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Salary & Compensation</h1>
        <p className="text-muted-foreground">View your salary history and download payslips</p>
      </div>
      <SalaryProgress />
    </div>
  );
}
