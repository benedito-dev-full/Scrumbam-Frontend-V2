"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useCreateDelayJustification,
  useDelayReasons,
  useTaskDelayJustification,
} from "@/hooks/use-delay-justifications";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const TEXTO_MAX = 2000;

/**
 * Modal para justificar (ou editar a justificativa de) o atraso de uma tarefa.
 *
 * Fluxo (Fase 1 — Captura): abre a partir da aba "Em atraso" do painel
 * `/assigned`. Se já existe justificativa vigente, entra em modo edição
 * (pré-seleciona o motivo + texto e mostra a versão). Categoria (radio) é
 * obrigatória; o detalhe (textarea, ≤2000) é opcional.
 *
 * Consome `useDelayReasons` (radio via GET /classes?idPai=-530),
 * `useTaskDelayJustification` (vigente) e `useCreateDelayJustification` (POST).
 * Erros tratados: 400 (tarefa não mais atrasada) e 403 (sem permissão).
 *
 * @param taskId   - ID da DTask a justificar (null = modal fechado/sem alvo).
 * @param taskNome - Título da tarefa, exibido no cabeçalho.
 * @param open     - Estado controlado de abertura.
 * @param onClose  - Callback ao fechar (Esc, clique fora, Cancelar, sucesso).
 */
export function DelayJustificationModal({
  taskId,
  taskNome,
  open,
  onClose,
}: {
  taskId: string | null;
  taskNome?: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: reasons = [], isLoading: loadingReasons } = useDelayReasons();
  const { data: vigente, isLoading: loadingVigente } =
    useTaskDelayJustification(taskId, open);
  const create = useCreateDelayJustification();

  const [motivo, setMotivo] = useState<string>("");
  const [texto, setTexto] = useState<string>("");

  // Hidratação sem useEffect (padrão oficial React: ajustar state durante a
  // render comparando uma chave anterior — evita o cascading render do
  // set-state-in-effect, banido pelo ESLint do repo). A chave muda quando o
  // modal abre/fecha, troca de tarefa, ou a vigente chega/é superseded.
  const hydrationKey = open
    ? `${taskId ?? ""}:${vigente?.id ?? "new"}`
    : "closed";
  const [prevKey, setPrevKey] = useState(hydrationKey);
  if (hydrationKey !== prevKey) {
    setPrevKey(hydrationKey);
    setMotivo(open ? (vigente?.motivoClasse ?? "") : "");
    setTexto(open ? (vigente?.texto ?? "") : "");
  }

  const editing = !!vigente;
  const saving = create.isPending;
  const canSave = !!motivo && !!taskId && !saving;

  async function handleSubmit() {
    if (!taskId || !motivo) return;
    try {
      await create.mutateAsync({
        taskId,
        dto: { motivoClasse: motivo, texto: texto.trim() || undefined },
      });
      toast.success(
        editing ? "Justificativa atualizada" : "Atraso justificado",
      );
      onClose();
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 400) {
        toast.error("Esta tarefa não está mais atrasada.");
        onClose();
      } else if (status === 403) {
        toast.error("Você não tem permissão para justificar esta tarefa.");
      } else {
        toast.error(getApiErrorMessage(err));
      }
    }
  }

  const delayContext =
    vigente && vigente.delayDays > 0
      ? `${vigente.delayDays} dia${vigente.delayDays !== 1 ? "s" : ""} de atraso${
          vigente.delayKind === "COMPLETED_LATE"
            ? " (concluída com atraso)"
            : vigente.delayKind === "OPEN"
              ? " (em aberto)"
              : ""
        }`
      : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400" />
            Justificar atraso
          </DialogTitle>
          <DialogDescription>
            {taskNome ? (
              <span className="line-clamp-2 text-foreground">{taskNome}</span>
            ) : (
              "Selecione o motivo do atraso."
            )}
            {editing && (
              <span className="mt-1 block text-xs text-muted-foreground">
                Editando a justificativa vigente (v{vigente!.version})
                {delayContext ? ` · ${delayContext}` : ""}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Motivos (radio obrigatório) */}
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Motivo <span className="text-amber-400">*</span>
          </legend>
          {loadingReasons || (open && loadingVigente && !vigente) ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : reasons.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              Nenhum motivo configurado.
            </p>
          ) : (
            reasons.map((r) => {
              const selected = motivo === r.chave;
              return (
                <label
                  key={r.chave}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                    selected
                      ? "border-[#7c5cff] bg-[#7c5cff]/10 text-foreground"
                      : "border-border text-foreground hover:bg-accent",
                  )}
                >
                  <input
                    type="radio"
                    name="delay-reason"
                    value={r.chave}
                    checked={selected}
                    onChange={() => setMotivo(r.chave)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-[#7c5cff] bg-[#7c5cff]"
                        : "border-border",
                    )}
                  >
                    {selected && (
                      <Check className="size-3 text-white" strokeWidth={3} />
                    )}
                  </span>
                  {r.nome}
                </label>
              );
            })
          )}
        </fieldset>

        {/* Detalhe (opcional) */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="delay-detail"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            Detalhe <span className="normal-case">(opcional)</span>
          </label>
          <textarea
            id="delay-detail"
            value={texto}
            maxLength={TEXTO_MAX}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Contexto do atraso…"
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#7c5cff]"
          />
          <span className="self-end text-[11px] text-muted-foreground tabular-nums">
            {texto.length}/{TEXTO_MAX}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Salvar alterações" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
