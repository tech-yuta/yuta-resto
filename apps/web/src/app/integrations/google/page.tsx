import { permanentRedirect } from 'next/navigation';

export default function LegacyGoogleIntegrationPage() {
  permanentRedirect('/integrations/google-business-profile');
}
