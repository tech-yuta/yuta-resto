import { DisplayMediaService } from '../../services/DisplayMediaService';
import { AdminShell } from './_components/AdminShell';

// Always render at request time — this page queries the database.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const initialMedia = await DisplayMediaService.getAll();
  return <AdminShell initialMedia={initialMedia} />;
}
