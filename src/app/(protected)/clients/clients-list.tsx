"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Pencil, Trash2, Building2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClientFormDialog } from "./client-form-dialog";
import { ClientReportButton } from "./client-report-button";
import { deleteClientRecord, toggleClientActive } from "./actions";

type Client = {
  id: string;
  name: string;
  pib: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
};

export function ClientsList({ clients }: { clients: Client[] }) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit(client: Client) {
    setEditing(client);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteClientRecord(id);
      } catch {
        toast.error("Failed to delete client");
      }
    });
  }

  function handleToggleActive(id: string, currentActive: boolean) {
    startTransition(async () => {
      try {
        await toggleClientActive(id, !currentActive);
      } catch {
        toast.error("Failed to update status");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/jobs" />}>
            <Briefcase data-icon="inline-start" />
            {t("jobs")}
          </Button>
          <Button onClick={handleAdd} size="sm">
            <Plus data-icon="inline-start" />
            {t("addClient")}
          </Button>
        </div>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {t("noClients")}
        </p>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Card key={client.id} size="sm">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {client.name}
                      </span>
                      <Badge
                        variant={client.is_active ? "secondary" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          handleToggleActive(client.id, client.is_active)
                        }
                      >
                        {client.is_active ? tc("active") : tc("inactive")}
                      </Badge>
                      <Badge variant="outline">
                        {client.type === "regular"
                          ? t("regular")
                          : t("oneTime")}
                      </Badge>
                    </div>
                    {client.pib && (
                      <div className="text-muted-foreground text-xs mt-0.5">
                        PIB: {client.pib}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ClientReportButton clientId={client.id} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(client)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(client.id)}
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

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
      />
    </div>
  );
}
