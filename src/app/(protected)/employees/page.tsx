import { getEmployees } from "./actions";
import { EmployeesList } from "./employees-list";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return <EmployeesList employees={employees} />;
}
