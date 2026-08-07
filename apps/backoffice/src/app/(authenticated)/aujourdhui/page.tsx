import { TodayDashboard } from './today-dashboard';
import { loadTodayDashboard } from './today-data';

export default async function TodayPage() {
  const data = await loadTodayDashboard();

  return <TodayDashboard data={data} />;
}
