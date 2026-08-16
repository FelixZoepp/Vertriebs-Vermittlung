"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  moduleId: number;
  videoUrl: string;
  durationSek: number;
  initialProgress: number;
}

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_INCREMENT_SEK = 15;

export function VideoPlayer({
  moduleId,
  videoUrl,
  durationSek,
  initialProgress,
}: VideoPlayerProps) {
  const [sekundenGesehen, setSekundenGesehen] = useState(initialProgress);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [masterclassComplete, setMasterclassComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sekundenRef = useRef(initialProgress);

  const percent = Math.min(
    100,
    Math.round((sekundenGesehen / durationSek) * 100)
  );

  const sendHeartbeat = useCallback(
    async (sekunden: number) => {
      try {
        const res = await fetch("/api/masterclass/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module_id: moduleId,
            sekunden_gesehen: sekunden,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.progress?.abgeschlossen) {
            setIsCompleted(true);
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
          if (data.masterclass_complete) {
            setMasterclassComplete(true);
          }
        }
        // If the API call fails, continue tracking locally (resilience)
      } catch {
        // Network error - continue tracking locally
      }
    },
    [moduleId]
  );

  const startTracking = useCallback(() => {
    if (isCompleted) return;
    setIsPlaying(true);
  }, [isCompleted]);

  const pauseTracking = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Manage the interval based on isPlaying state
  useEffect(() => {
    if (isPlaying && !isCompleted) {
      // Send initial heartbeat with current state
      sendHeartbeat(sekundenRef.current);

      intervalRef.current = setInterval(() => {
        sekundenRef.current = Math.max(
          sekundenRef.current,
          sekundenRef.current + HEARTBEAT_INCREMENT_SEK
        );
        setSekundenGesehen(sekundenRef.current);
        sendHeartbeat(sekundenRef.current);
      }, HEARTBEAT_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, isCompleted, sendHeartbeat]);

  // Keep sekundenRef in sync
  useEffect(() => {
    sekundenRef.current = sekundenGesehen;
  }, [sekundenGesehen]);

  if (isCompleted) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-green-600">
          <svg
            className="size-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium">Modul abgeschlossen</span>
        </div>
        {masterclassComplete && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            Alle Pflichtmodule abgeschlossen! Dein Status wurde aktualisiert.
          </div>
        )}
      </div>
    );
  }

  // Convert Google Drive share URL to embeddable preview URL
  const embedUrl = videoUrl.includes("drive.google.com")
    ? videoUrl.replace(/\/view(\?.*)?$/, "/preview")
    : videoUrl;

  const minutenGesamt = Math.round(durationSek / 60);
  const minutenGesehen = Math.round(sekundenGesehen / 60);

  return (
    <div className="mt-3 space-y-3">
      {/* Video embed */}
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
        <iframe
          src={embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Masterclass Video"
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {minutenGesehen} / {minutenGesamt} Min. ({percent}%)
          </span>
          {isPlaying && (
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 animate-pulse rounded-full bg-green-500" />
              Wird getrackt
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isPlaying ? (
          <Button onClick={startTracking} size="sm">
            {sekundenGesehen > 0 ? "Fortsetzen" : "Starten"}
          </Button>
        ) : (
          <Button onClick={pauseTracking} variant="outline" size="sm">
            Pausieren
          </Button>
        )}
        {videoUrl && (
          <Button variant="ghost" size="sm">
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              In neuem Tab öffnen
            </a>
          </Button>
        )}
      </div>

      {masterclassComplete && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Alle Pflichtmodule abgeschlossen! Dein Status wurde aktualisiert.
        </div>
      )}
    </div>
  );
}
