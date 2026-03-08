import { Badge } from '@/components/ui/badge';
import { Stethoscope, User, Shield } from 'lucide-react';

interface UserTypeBadgeProps {
  type: 'doctor' | 'patient' | 'admin';
}

const USER_TYPE_CONFIG = {
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
  },
  patient: {
    label: 'Patient',
    icon: User,
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
  },
} as const;

export function UserTypeBadge({ type }: UserTypeBadgeProps) {
  const config = USER_TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
