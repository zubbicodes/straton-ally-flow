import { Calendar, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Leave() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage employee leave requests
          </p>
        </div>
        <Button variant="accent" size="lg" disabled>
          <Plus className="h-5 w-5 mr-2" />
          Coming Soon
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card className="card-elevated">
        <CardContent className="py-16">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Leave Management Module</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Full leave management functionality including leave requests, approvals, 
              balance tracking, and leave policies will be available in the next update.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">Leave Requests</Badge>
              <Badge variant="secondary">Approval Workflow</Badge>
              <Badge variant="secondary">Leave Balance</Badge>
              <Badge variant="secondary">Leave Calendar</Badge>
              <Badge variant="secondary">Leave Policies</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Employees can submit leave requests with date range, type, and reason
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Leave Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visual calendar showing team availability and approved leaves
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Balance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track leave balances by type with automatic accrual and deduction
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
