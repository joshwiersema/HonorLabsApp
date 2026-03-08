import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PatientsTable } from '@/components/patients/PatientsTable';
import { PatientDetail } from '@/components/patients/PatientDetail';

export function Patients() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage verified patients and view their purchase activity"
      />

      <PatientsTable onViewPatient={setSelectedPatientId} />

      <PatientDetail
        patientId={selectedPatientId}
        open={selectedPatientId !== null}
        onClose={() => setSelectedPatientId(null)}
      />
    </div>
  );
}
