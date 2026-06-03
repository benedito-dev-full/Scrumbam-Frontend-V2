import { getApiErrorMessage } from "@/lib/api";

/** Classe interna das Listas (DProject.idClasse). */
export const ID_CLASSE_LIST = "-352";

export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }

  const response = (
    error as { response?: { status?: number; data?: { statusCode?: number } } }
  ).response;
  return response?.status ?? response?.data?.statusCode;
}

export function normalizeErrorText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function tableFieldsErrorDescription(error: unknown): string {
  const status = getErrorStatus(error);
  const message = getApiErrorMessage(error);
  const normalized = normalizeErrorText(message);

  if (status === 409) {
    return "As colunas foram alteradas em outra sessão. Recarreguei os dados; tente novamente.";
  }
  if (normalized.includes("option") && normalized.includes("id")) {
    return "As opções de Status/Lista suspensa precisam ter IDs únicos.";
  }
  if (normalized.includes("options") || normalized.includes("opcoes")) {
    return "Colunas de Status e Lista suspensa precisam ter pelo menos uma opção.";
  }
  if (normalized.includes("order") || normalized.includes("ordem")) {
    return "A ordem das colunas ficou inválida. Recarreguei o schema; tente novamente.";
  }
  if (normalized.includes("key") || normalized.includes("chave")) {
    return "Já existe uma coluna com essa chave. Tente outro nome.";
  }
  if (status === 400) {
    return message !== "Erro inesperado"
      ? message
      : "O backend recusou o schema das colunas. Recarreguei os dados; tente novamente.";
  }

  return message !== "Erro inesperado"
    ? message
    : "Não foi possível atualizar o schema das colunas. Tente novamente.";
}

export function fieldErrorDescription(error: unknown): string {
  const status = getErrorStatus(error);
  const message = getApiErrorMessage(error);
  const normalized = normalizeErrorText(message);

  if (status === 409) {
    return "A tarefa foi alterada em outra sessão. Recarreguei os dados; tente novamente.";
  }
  if (
    normalized.includes("invalid") ||
    normalized.includes("inval") ||
    normalized.includes("tipo") ||
    normalized.includes("type") ||
    normalized.includes("valor") ||
    normalized.includes("value")
  ) {
    return "Valor inválido para o tipo desta coluna.";
  }
  if (status === 400) {
    return message !== "Erro inesperado"
      ? message
      : "O backend recusou o valor enviado para esta célula.";
  }

  return message !== "Erro inesperado"
    ? message
    : "Não foi possível salvar esta célula. Tente novamente.";
}

export function normalizeCellValue(
  value: import("@/lib/types/table-fields").FieldValue,
): import("@/lib/types/table-fields").FieldValue {
  return typeof value === "string" && value.trim() === "" ? null : value;
}
