import { UserPlus, Clock, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/formatters';
import type { Doctor } from '@/types/doctor';

interface DoctorPipelineProps {
  doctors: Doctor[] | undefined;
  isLoading: boolean;
}

function PipelineSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function DoctorPipeline({
  doctors,
  isLoading,
}: DoctorPipelineProps) {
  const pendingDoctors = (doctors ?? []).filter(
    (d) => d.doctor_status === 'pending'
  );
  const pendingCount = pendingDoctors.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Doctor Pipeline</CardTitle>
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          {pendingCount} Pending
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <PipelineSkeleton />
        ) : pendingDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-10 w-10 text-success/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              All caught up!
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              No pending doctor applications.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Summary banner */}
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-warning/10 px-4 py-3">
              <UserPlus className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">
                  {pendingCount} application{pendingCount !== 1 ? 's' : ''} awaiting
                  review
                </p>
                <p className="text-xs text-muted-foreground">
                  Review and approve to onboard new doctors.
                </p>
              </div>
            </div>

            {/* Recent applications */}
            <div className="divide-y">
              {pendingDoctors.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Dr. {doc.first_name} {doc.last_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {doc.practice_name}
                      {doc.specialty ? ` · ${doc.specialty}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      Applied {doc.date_created ? formatDate(doc.date_created) : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {pendingDoctors.length > 5 && (
              <p className="pt-2 text-center text-xs text-muted-foreground">
                +{pendingDoctors.length - 5} more application
                {pendingDoctors.length - 5 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
