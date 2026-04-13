import { getStatistics } from "./actions";
import { StatisticsContent } from "./statistics-content";

export default async function StatisticsPage() {
  const data = await getStatistics();

  return <StatisticsContent data={data} />;
}
