"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction } from "../_actions/add-note";
import { Loader2, Send } from "lucide-react";

interface NoteFormProps {
  entityTyp: string;
  entityId: number;
}

export function NoteForm({ entityTyp, entityId }: NoteFormProps) {
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const router = useRouter();

  function handleSubmit() {
    if (!content.trim()) return;

    startTransition(async () => {
      const result = await addNoteAction(entityTyp, entityId, content);
      if (result?.error) {
        alert(result.error);
      } else {
        setContent("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Notiz hinzufuegen..."
        rows={3}
        disabled={isPending}
      />
      <Button
        onClick={handleSubmit}
        disabled={isPending || !content.trim()}
        className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {isPending ? "Wird gespeichert..." : "Notiz speichern"}
      </Button>
    </div>
  );
}
