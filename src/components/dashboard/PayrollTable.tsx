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
      <CardHeader className="pb-2 md:pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <CardTitle className="text-sm md:text-base font-semibold">Payroll List</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-8 w-full sm:w-[140px] pl-8 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] md:text-xs font-medium h-8 md:h-9 whitespace-nowrap">Name</TableHead>
                <TableHead className="text-[10px] md:text-xs font-medium h-8 md:h-9 hidden sm:table-cell">Job Title</TableHead>
                <TableHead className="text-[10px] md:text-xs font-medium h-8 md:h-9 text-right">Salary</TableHead>
                <TableHead className="text-[10px] md:text-xs font-medium h-8 md:h-9 text-right hidden md:table-cell">Deduct.</TableHead>
                <TableHead className="text-[10px] md:text-xs font-medium h-8 md:h-9 text-right">Total</TableHead>
                <TableHead className="text-[10px] md:text-xs font-medium h-8 md:h-9 text-right">Payslip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-xs md:text-sm">
                    No payroll data available
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id} className="group">
                    <TableCell className="py-2 md:py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 md:h-8 md:w-8">
                          <AvatarFallback className="text-[10px] md:text-xs bg-secondary">
                            {emp.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate">{emp.name}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">{emp.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 md:py-2.5 hidden sm:table-cell">
                      <p className="text-xs md:text-sm truncate">{emp.jobTitle}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">{emp.department}</p>
                    </TableCell>
                    <TableCell className="py-2 md:py-2.5 text-right text-xs md:text-sm whitespace-nowrap">
                      ${emp.salary.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 md:py-2.5 text-right text-xs md:text-sm hidden md:table-cell">
                      ${emp.deduction.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 md:py-2.5 text-right text-xs md:text-sm font-medium whitespace-nowrap">
                      ${emp.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 md:py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 md:h-7 text-[10px] md:text-xs gap-1 px-2"
                      >
                        <Download className="h-3 w-3" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {employees.length > 0 && (
          <div className="flex items-center justify-between mt-3 md:mt-4 text-[10px] md:text-xs text-muted-foreground">
            <p>1-{employees.length} of {employees.length}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-6 w-6 md:h-7 md:w-7 text-[10px]" disabled>
                {'<'}
              </Button>
              <Button variant="default" size="icon" className="h-6 w-6 md:h-7 md:w-7 text-[10px]">
                1
              </Button>
              <Button variant="outline" size="icon" className="h-6 w-6 md:h-7 md:w-7 text-[10px]">
                {'>'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
