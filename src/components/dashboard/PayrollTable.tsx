import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Download } from 'lucide-react';

interface PayrollEmployee {
  id: string;
  name: string;
  employeeId: string;
  jobTitle: string;
  department: string;
  salary: number;
  deduction: number;
  total: number;
}

interface PayrollTableProps {
  employees: PayrollEmployee[];
}

export function PayrollTable({ employees }: PayrollTableProps) {
  return (
    <Card className="border-border/50 shadow-none">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Payroll List</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search employee, ID, etc"
              className="h-8 w-[180px] pl-8 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium h-9">Name</TableHead>
              <TableHead className="text-xs font-medium h-9">Job Title</TableHead>
              <TableHead className="text-xs font-medium h-9 text-right">Salary</TableHead>
              <TableHead className="text-xs font-medium h-9 text-right">Deduct.</TableHead>
              <TableHead className="text-xs font-medium h-9 text-right">Total</TableHead>
              <TableHead className="text-xs font-medium h-9 text-right">Payslip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  No payroll data available
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} className="group">
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-secondary">
                          {emp.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <p className="text-sm">{emp.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">{emp.department}</p>
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-sm">
                    ${emp.salary.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-sm">
                    ${emp.deduction.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-sm font-medium">
                    ${emp.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {employees.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <p>Show 10 of {employees.length} results</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled>
                {'<'}
              </Button>
              <Button variant="default" size="icon" className="h-7 w-7">
                1
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7">
                2
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7">
                {'>'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
