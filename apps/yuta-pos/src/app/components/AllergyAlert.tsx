import { Alert, AlertDescription, AlertTitle, Badge, cn } from '@yuta/ui';
import { ShieldCheck, TriangleAlert } from 'lucide-react';

type AllergyAlertProps = {
  allergyNote: string | null;
  acknowledged: boolean;
  className?: string;
};

export function AllergyAlert({
  allergyNote,
  acknowledged,
  className,
}: AllergyAlertProps) {
  return (
    <Alert tone="danger" className={cn('border-2', className)}>
      <TriangleAlert className="h-5 w-5" />
      <AlertTitle className="flex flex-wrap items-center gap-2 font-black uppercase">
        Allergie client
        <Badge tone={acknowledged ? 'success' : 'danger'} variant="solid">
          {acknowledged ? (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Cuisine informee
            </span>
          ) : (
            'Confirmation requise'
          )}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-1 break-words text-base font-black">
        {allergyNote}
      </AlertDescription>
    </Alert>
  );
}
