import { TablesPage } from './tables-page';
import { requireBookingTenant } from '../../../../server/auth/session';

export default async function Page() {
  await requireBookingTenant('/etablissement/salles-tables');
  return <TablesPage />;
}
