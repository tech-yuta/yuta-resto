import { permanentRedirect } from 'next/navigation';

export default function LegacyDataManagementPage() {
  permanentRedirect('/gestion-des-donnees');
}
