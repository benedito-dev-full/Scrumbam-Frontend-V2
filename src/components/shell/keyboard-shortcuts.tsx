"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCommandPaletteStore } from "@/lib/stores/command-palette";
import { useShortcutsHelpStore } from "@/lib/stores/shortcuts-help";

const CHORD_TIMEOUT_MS = 1200;

const G_ROUTES: Record<string, string> = {
  h: "/",
  i: "/inbox",
  t: "/tasks",
  s: "/sprints",
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const toggleCommand = useCommandPaletteStore((s) => s.toggle);
  const toggleHelp = useShortcutsHelpStore((s) => s.toggle);

  const gPressedRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearG = () => {
      gPressedRef.current = false;
      if (gTimerRef.current) {
        clearTimeout(gTimerRef.current);
        gTimerRef.current = null;
      }
    };

    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
        return;
      }

      if (meta && e.key === "/") {
        e.preventDefault();
        toggleHelp();
        return;
      }

      if (isTypingTarget(e.target)) return;
      if (meta || e.altKey) return;

      if (gPressedRef.current) {
        const route = G_ROUTES[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
        clearG();
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gPressedRef.current = true;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        gTimerRef.current = setTimeout(clearG, CHORD_TIMEOUT_MS);
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      clearG();
    };
  }, [router, toggleCommand, toggleHelp]);

  return null;
}
