"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { deleteEmployee, toggleEmployeeActive } from "./actions";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export function EmployeesList({ employees }: { employees: Employee[] }) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit(employee: Employee) {
    setEditing(employee);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteEmployee(id);
      } catch {
        toast.error("Failed to delete employee");
      }
    });
  }

  function handleToggleActive(id: string, currentActive: boolean) {
    startTransition(async () => {
      try {
        await toggleEmployeeActive(id, !currentActive);
      } catch {
        toast.error("Failed to update status");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <Button onClick={handleAdd} size="sm">
          <Plus data-icon="inline-start" />
          {t("addEmployee")}
        </Button>
      </div>

      {employees.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {t("noEmployees")}
        </p>
      ) : (
        <div className="grid gap-3">
          {employees.map((emp) => (
            <Card key={emp.id} size="sm">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {emp.first_name} {emp.last_name}
                      </span>
                      <Badge
                        variant={emp.is_active ? "secondary" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          handleToggleActive(emp.id, emp.is_active)
                        }
                      >
                        {emp.is_active ? tc("active") : tc("inactive")}
                      </Badge>
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                        <Phone className="size-3" />
                        {emp.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(emp)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(emp.id)}
                    disabled={isPending}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editing}
      />
    </div>
  );
}
