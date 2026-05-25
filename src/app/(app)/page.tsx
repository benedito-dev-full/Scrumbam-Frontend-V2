"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSpaces } from "@/hooks/use-projects";
import { useAuthStore } from "@/lib/stores/auth";

export default function HomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: spaces, isLoading } = useSpaces();

  useEffect(() => {
    if (!accessToken) return;
    if (isLoading) return;

    if (spaces && spaces.length > 0) {
      router.replace(`/spaces/${spaces[0].id}`);
    } else {
      router.replace("/inbox");
    }
  }, [accessToken, isLoading, spaces, router]);

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Carregando…
    </div>
  );
}
