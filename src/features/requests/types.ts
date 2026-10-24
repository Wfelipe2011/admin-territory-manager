export type ChangeRequest = {
  id: number;
  entity: "block" | "street" | "house";
  action: "create" | "update" | "delete";
  status: "pending" | "approved" | "rejected";
  territoryId: number;
  blockId: number | null;
  addressId: number | null;
  targetId: number;
  parentRequestId: number | null;
  proposedData: Record<string, unknown> & {
    _context?: { territory?: string; block?: string; street?: string };
  };
  beforeData: Record<string, unknown> | null;
  observations: string;
  requestedByName: string | null;
  requestedAt: string | null;
  updatedAt: string;
  version: number;
  reviewedAt: string | null;
  reviewerId: number | null;
  reviewReason: string | null;
  isLegacy: boolean;
  history: {
    event: string;
    at: string;
    userId?: number;
    reason?: string;
    parentId?: number;
  }[];
};
export type RequestDetail = ChangeRequest & {
  current: Record<string, unknown> | null;
  impact: { houses: number; rounds: number; token: string } | null;
  ancestors: ChangeRequest[];
  descendants: ChangeRequest[];
  conflict: boolean;
};
export type RequestList = {
  items: ChangeRequest[];
  total: number;
  page: number;
  limit: number;
};
export const entityLabels = { block: "Quadra", street: "Rua", house: "Casa" };
export const actionLabels = {
  create: "Cadastro",
  update: "Correção",
  delete: "Exclusão",
};
export const statusLabels = {
  pending: "Em análise",
  approved: "Aprovada",
  rejected: "Rejeitada",
};
export const requestName = (row: ChangeRequest) =>
  String(
    row.proposedData.name ??
      row.proposedData.number ??
      row.beforeData?.name ??
      row.beforeData?.number ??
      `#${row.targetId}`,
  );
