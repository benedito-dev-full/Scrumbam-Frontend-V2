"use client";

import { ChevronDown, FolderTree, Search } from "lucide-react";

import {
  DropdownPortal,
  chipStyle,
  dropdownItemStyle,
  dropdownStyle,
  itemHover,
} from "@/components/tasks/create-task-modal-parts";
import type { ListWithPath } from "@/hooks/use-projects";

interface CreateTaskListSelectorProps {
  selectedList: ListWithPath | null;
  selectedListId: string | null;
  filteredLists: ListWithPath[];
  listQuery: string;
  listsLoading: boolean;
  open: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  portalRef: React.RefObject<HTMLDivElement | null>;
  onOpenChange: (open: boolean) => void;
  onListQueryChange: (value: string) => void;
  onSelectList: (listId: string) => void;
}

export function CreateTaskListSelector({
  selectedList,
  selectedListId,
  filteredLists,
  listQuery,
  listsLoading,
  open,
  triggerRef,
  portalRef,
  onOpenChange,
  onListQueryChange,
  onSelectList,
}: CreateTaskListSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: "calc(var(--section-gap) + 2px)",
        position: "relative",
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        style={{ ...chipStyle, maxWidth: 360 }}
        title={
          selectedList
            ? `${selectedList.spaceName}${
                selectedList.folderName ? " › " + selectedList.folderName : ""
              } › ${selectedList.nome}`
            : "Selecionar lista"
        }
      >
        <FolderTree size={12} style={{ color: "#7c6ff7", flexShrink: 0 }} />
        <span
          style={{
            fontSize: 12,
            color: selectedList ? "#c4c4cc" : "#6b6b74",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedList ? selectedList.nome : "Selecionar lista…"}
        </span>
        <ChevronDown
          size={11}
          color="var(--muted-foreground)"
          style={{ flexShrink: 0 }}
        />
      </button>

      {open && (
        <DropdownPortal triggerRef={triggerRef} portalRef={portalRef}>
          <div
            style={{
              ...dropdownStyle,
              minWidth: 320,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Search size={12} style={{ color: "#6b6b74", flexShrink: 0 }} />
              <input
                autoFocus
                type="search"
                value={listQuery}
                onChange={(e) => onListQueryChange(e.target.value)}
                placeholder="Buscar lista…"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#e4e4e4",
                  fontSize: 12,
                }}
              />
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto", padding: 4 }}>
              {listsLoading ? (
                <div
                  style={{
                    padding: "12px 10px",
                    fontSize: 12,
                    color: "#6b6b74",
                    textAlign: "center",
                  }}
                >
                  Carregando listas…
                </div>
              ) : filteredLists.length === 0 ? (
                <div
                  style={{
                    padding: "12px 10px",
                    fontSize: 12,
                    color: "#6b6b74",
                    textAlign: "center",
                  }}
                >
                  Nenhuma lista encontrada.
                </div>
              ) : (
                filteredLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => onSelectList(list.id)}
                    data-selected={selectedListId === list.id ? "1" : "0"}
                    style={{
                      ...dropdownItemStyle,
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 2,
                      background:
                        selectedListId === list.id ? "var(--border)" : "none",
                    }}
                    {...itemHover}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "#e4e4e4",
                        lineHeight: 1.2,
                      }}
                    >
                      {list.nome}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#6b6b74",
                        lineHeight: 1.2,
                      }}
                    >
                      {list.spaceName}
                      {list.folderName ? ` › ${list.folderName}` : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
}
