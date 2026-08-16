"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { generateInvoiceForPlacement } from "@/app/admin/rechnungen/_actions";
import { confirmContractReport } from "@/app/admin/rechnungen/_actions";

export function CreateInvoiceButton({
  placementId,
  typ,
  label,
}: {
  placementId: number;
  typ: "einstellung" | "meilenstein_100";
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await generateInvoiceForPlacement(placementId, typ);
          if (result.error) {
            alert(result.error);
          }
        });
      }}
    >
      {isPending ? "Wird erstellt..." : label}
    </Button>
  );
}

export function ConfirmReportButton({ reportId }: { reportId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="xs"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await confirmContractReport(reportId);
          if (result.error) {
            alert(result.error);
          }
        });
      }}
    >
      {isPending ? "..." : "Bestätigen"}
    </Button>
  );
}
