import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { DoctorApplications } from '@/components/doctors/DoctorApplications';
import { ActiveDoctors } from '@/components/doctors/ActiveDoctors';
import { DoctorProfile } from '@/components/doctors/DoctorProfile';
import { useDoctors } from '@/hooks/useDoctors';

export function Doctors() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const { data } = useDoctors();

  const pendingCount = (data?.doctors ?? []).filter(
    (d) => d.doctor_status === 'pending'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Manage doctor accounts, review applications, and track referral performance."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Doctors</TabsTrigger>
          <TabsTrigger value="applications" className="gap-1.5">
            Applications
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <ActiveDoctors onViewDoctor={setSelectedDoctorId} />
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <DoctorApplications />
        </TabsContent>
      </Tabs>

      {/* Doctor Profile Dialog */}
      <DoctorProfile
        doctorId={selectedDoctorId}
        open={selectedDoctorId !== null}
        onClose={() => setSelectedDoctorId(null)}
      />
    </div>
  );
}
