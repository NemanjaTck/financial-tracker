import { getJobs } from "./actions";
import { getClients } from "../clients/actions";
import { getEmployees } from "../employees/actions";
import { JobsList } from "./jobs-list";

export default async function JobsPage() {
  const [jobs, clients, employees] = await Promise.all([
    getJobs(),
    getClients(),
    getEmployees(),
  ]);

  return (
    <JobsList
      jobs={jobs}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      employees={employees.map((e) => ({
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
      }))}
    />
  );
}
