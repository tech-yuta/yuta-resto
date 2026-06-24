import { DisplayMediaService } from '../../services/DisplayMediaService';
import { AdminShell } from './_components/AdminShell';

export default async function AdminPage() {
  const initialMedia = await DisplayMediaService.getAll();
  return <AdminShell initialMedia={initialMedia} />;
}
