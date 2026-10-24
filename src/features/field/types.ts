export type Access = {
  code: string;
  role: "overseer" | "publisher";
  territoryId: number;
  blockId: number | null;
  round: number | null;
  canEditStructure: boolean;
  expiresAt: string;
  overseer: string;
};
export type RoundInfo = {
  name: string;
  theme: "default" | "campaign" | "letters";
  colorPrimary: string | null;
  colorSecondary: string | null;
};
export type FieldSession = {
  token: string;
  access: Access;
  roundInfo: RoundInfo | null;
};
export type PendingRequest = {
  id: number;
  action: "create" | "update" | "delete";
};
export type Registration = {
  registrationStatus: "pending" | "approved" | "rejected";
  pendingRequest: PendingRequest | null;
};
export type Block = Registration & {
  catalogTotal: number;
  withoutRound: number;
  id: number;
  name: string;
  completed: number;
  pending: number;
  total: number;
  lastWorkedAt: string | null;
  suggestedPairs: number;
  suggestion: string;
  signature: { key: string; expirationDate: string } | null;
};
export type Street = Registration & {
  mappingId: number | null;
  zipCode: string | null;
  total: number;
  catalogTotal: number;
  withoutRound: number;
  id: number;
  name: string;
  completed: number;
  pending: number;
  firstNumber: string | null;
  lastNumber: string | null;
  houses: House[];
};
export type House = Registration & {
  hasRound: boolean;
  id: number;
  number: string;
  legend: string | null;
  status: boolean;
  leaveLetter: boolean;
  dontVisit: boolean;
  reportType: string | null;
  readOnly: boolean;
  complement: string | null;
  canMark: boolean;
  canUnmark: boolean;
  canUnmarkUntil: string | null;
  blockedReason:
    | "no_round"
    | "pending_approval"
    | "dont_visit"
    | "pending_report"
    | "closed_round"
    | "unmark_window_expired"
    | null;
};
export type Snapshot = {
  workRoundNumber: number | null;
  capabilities: { canEditStructure: boolean; canReportHouses: boolean };
  territory: { id: number; name: string; imageUrl: string | null };
  roundInfo: RoundInfo;
  tenancy: { name: string; city: string; state: string; phone: string | null };
  blocks: Block[];
  streets: Street[];
  block: Block | null;
};
export type BlockSnapshot = Omit<Snapshot, "blocks">;
export type Presence = {
  total: number;
  blocks: Record<string, number>;
  streets: Record<string, number>;
};
export type SyncResponse<T = Snapshot> = {
  cursor: string;
  changed: boolean;
  data?: T;
  presence: Presence;
};
export type ScreenScope = { scope: "territory" | "block"; blockId?: number };
