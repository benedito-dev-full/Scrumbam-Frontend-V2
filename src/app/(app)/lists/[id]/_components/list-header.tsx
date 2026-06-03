"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, FolderOpen, Share2, Sparkles, Star } from "lucide-react";
import { AgentPopover } from "@/components/spaces/agent-popover";
import { SpaceChip } from "@/components/shell/space-chip";
import { IcCaret, IcList } from "@/components/lists/icons";
import { useIsBookmarked, useToggleBookmark } from "@/hooks/use-bookmarks";
import { useProject } from "@/hooks/use-projects";
import type { DProjectDto } from "@/lib/types/api";
import type { HierarchyCrumb } from "../_lib/list-view-types";

// ─── TbBtn — botão de toolbar do header ──────────────────────────────────────
export function TbBtn({
  icon,
  label,
  bordered,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  bordered?: boolean;
  /** Se presente, renderiza como `<a>` para navegar (ex: link para /ia). */
  href?: string;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 28,
    padding: "0 10px",
    borderRadius: 6,
    border: bordered ? "1px solid #2a2a32" : "none",
    background: bordered ? "var(--card)" : "none",
    color: "var(--muted-foreground)",
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "none",
  };
  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
      (e.currentTarget.style.color = "var(--foreground)"),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) =>
      (e.currentTarget.style.color = "var(--muted-foreground)"),
  };
  if (href) {
    return (
      <a href={href} style={style} {...handlers}>
        {icon}
        {label}
      </a>
    );
  }
  return (
    <button type="button" style={style} {...handlers}>
      {icon}
      {label}
    </button>
  );
}

// ─── BreadcrumbIcon ──────────────────────────────────────────────────────────
export function BreadcrumbIcon({ crumb }: { crumb: HierarchyCrumb }) {
  if (crumb.type === "space") {
    const space = crumb.project;
    return (
      <SpaceChip
        iniciais={(space?.nome ?? crumb.label).slice(0, 2).toUpperCase()}
        cor={space?.color ?? "#6366f1"}
        iconName={space?.icon}
        size="xs"
      />
    );
  }

  if (crumb.type === "folder") {
    return (
      <FolderOpen
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
      />
    );
  }

  return <IcList size={13} />;
}

// ─── BreadcrumbItem ──────────────────────────────────────────────────────────
export function BreadcrumbItem({ crumb }: { crumb: HierarchyCrumb }) {
  const content = (
    <>
      <BreadcrumbIcon crumb={crumb} />
      <span className="truncate">{crumb.label}</span>
    </>
  );
  const className =
    "inline-flex max-w-36 min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors";

  if (crumb.href) {
    return (
      <Link
        href={crumb.href}
        className={`${className} hover:bg-accent hover:text-foreground`}
        title={crumb.label}
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      className={`${className} font-medium text-foreground/80`}
      title={crumb.label}
    >
      {content}
    </span>
  );
}

// ─── HierarchyBreadcrumb ─────────────────────────────────────────────────────
export function HierarchyBreadcrumb({ projeto }: { projeto: DProjectDto }) {
  const { data: parent } = useProject(projeto.idPai);
  const parentIsFolder = parent?.idClasse === "-351";
  const parentIsSpace = parent?.idClasse === "-350";
  const { data: spaceParent } = useProject(
    parentIsFolder ? parent.idPai : null,
  );

  if (projeto.idPai && !parent) return null;

  const space =
    parentIsSpace
      ? parent
      : spaceParent?.idClasse === "-350"
        ? spaceParent
        : null;

  if (parentIsFolder && !space) return null;

  const folder = parentIsFolder ? parent : null;
  const crumbs: HierarchyCrumb[] = [];

  if (space) {
    crumbs.push({
      id: space.id,
      label: space.nome,
      type: "space",
      href: `/spaces/${space.id}`,
      project: space,
    });
  }

  if (folder) {
    crumbs.push({
      id: folder.id,
      label: folder.nome,
      type: "folder",
      href: `/folders/${folder.id}`,
    });
  }

  crumbs.push({ id: projeto.id, label: projeto.nome, type: "list" });

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Caminho da lista"
      className="ml-1 hidden min-w-0 items-center gap-1 border-l border-border pl-2 text-xs text-muted-foreground md:flex"
    >
      {crumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          {index > 0 && (
            <ChevronRight
              aria-hidden
              className="size-3 shrink-0 text-muted-foreground/60"
            />
          )}
          <BreadcrumbItem crumb={crumb} />
        </React.Fragment>
      ))}
    </nav>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ projeto }: { projeto: DProjectDto }) {
  const { id, nome } = projeto;
  const { isBookmarked, bookmark } = useIsBookmarked(id, "list");
  const { toggle, isPending } = useToggleBookmark();

  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between gap-4 px-5"
      style={{
        borderBottom: "1px solid #26262d",
        background: "var(--background)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <IcList size={16} />
        <h1
          className="truncate text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {nome}
        </h1>
        <button
          type="button"
          style={{
            display: "grid",
            width: 20,
            height: 20,
            placeItems: "center",
            borderRadius: 4,
            color: "var(--muted-foreground)",
            background: "none",
            border: 0,
          }}
        >
          <IcCaret size={12} />
        </button>
        <button
          type="button"
          aria-label={
            isBookmarked ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          disabled={isPending}
          onClick={() =>
            toggle({
              targetId: id,
              targetType: "list",
              bookmarkId: bookmark?.id,
            })
          }
          style={{
            display: "grid",
            width: 24,
            height: 24,
            placeItems: "center",
            borderRadius: 4,
            color: isBookmarked ? "#f59e0b" : "var(--muted-foreground)",
            background: "none",
            border: 0,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f59e0b";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isBookmarked
              ? "#f59e0b"
              : "var(--muted-foreground)";
          }}
        >
          <Star
            className="size-3.5"
            fill={isBookmarked ? "#f59e0b" : "none"}
            stroke={isBookmarked ? "#f59e0b" : "currentColor"}
          />
        </button>
        <HierarchyBreadcrumb projeto={projeto} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <AgentPopover projectId={id} projectName={nome} />
        <TbBtn
          icon={<Sparkles className="size-3.5" />}
          label="Pergunte à IA"
          href="https://scrumban.com.br/ia"
        />
        <div
          style={{
            width: 1,
            height: 16,
            background: "var(--accent)",
            margin: "0 4px",
          }}
        />
        <TbBtn
          icon={<Share2 className="size-3.5" />}
          label="Compartilhar"
          bordered
        />
      </div>
    </header>
  );
}
