"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import {
  resendInvoice,
  confirmContractReport,
} from "./_actions";

export function SendInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="xs"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await resendInvoice(invoiceId);
          if (result.error) {
            alert(result.error);
          }
        });
      }}
    >
      {isPending ? "Wird gesendet..." : "Senden"}
    </Button>
  );
}

export function RetryInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="xs"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await resendInvoice(invoiceId);
          if (result.error) {
            alert(result.error);
          }
        });
      }}
    >
      {isPending ? "Wird versucht..." : "Erneut versuchen"}
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
      {isPending ? "Wird bestätigt..." : "Bestätigen"}
    </Button>
  );
}
