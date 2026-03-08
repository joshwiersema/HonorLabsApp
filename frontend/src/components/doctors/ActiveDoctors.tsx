import { useState, useCallback } from 'react';
import { Copy, Check, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctors } from '@/hooks/useDoctors';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

interface ActiveDoctorsProps {
  onViewDoctor: (id: number) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [text]
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
      aria-label="Copy referral code"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ActiveDoctors({ onViewDoctor }: ActiveDoctorsProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useDoctors();

  const doctors = data?.doctors ?? [];

  // Only show approved doctors in the active tab
  const activeDoctors = doctors.filter((d) => d.doctor_status === 'approved');

  const filteredDoctors = search
    ? activeDoctors.filter((d) => {
        const searchLower = search.toLowerCase();
        const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          d.email.toLowerCase().includes(searchLower) ||
          (d.practice_name && d.practice_name.toLowerCase().includes(searchLower))
        );
      })
    : activeDoctors;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, email, or practice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Table */}
      {!isLoading && filteredDoctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border py-16">
          <Stethoscope className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">No doctors found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? 'Try adjusting your search terms.'
              : 'No doctors registered at this time.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>Practice</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                filteredDoctors.map((doctor) => (
                  <TableRow
                    key={doctor.id}
                    className="cursor-pointer"
                    onClick={() => onViewDoctor(doctor.id)}
                  >
                    <TableCell className="font-medium">
                      {doctor.first_name} {doctor.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doctor.email}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {doctor.npi_number || '-'}
                    </TableCell>
                    <TableCell>{doctor.practice_name || '-'}</TableCell>
                    <TableCell>{doctor.specialty || '-'}</TableCell>
                    <TableCell>
                      {doctor.referral_code ? (
                        <div className="flex items-center gap-1">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                            {doctor.referral_code}
                          </code>
                          <CopyButton text={doctor.referral_code} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(doctor.orders_count)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(doctor.total_spent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doctor.date_created
                        ? formatDate(doctor.date_created)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
