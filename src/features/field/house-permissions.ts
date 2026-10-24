import { House } from "./types";

const blockedLabels = {
  no_round: "Sem rodada",
  pending_approval: "Aguardando aprovação",
  dont_visit: "Não bater",
  pending_report: "Em análise",
  closed_round: "Rodada encerrada",
  unmark_window_expired: "Prazo encerrado",
};
export function houseAction(house: House, now: number) {
  const expired =
    house.status &&
    !!house.canUnmarkUntil &&
    now >= Date.parse(house.canUnmarkUntil);
  return {
    allowed: (house.status ? house.canUnmark : house.canMark) && !expired,
    reason: expired
      ? blockedLabels.unmark_window_expired
      : house.blockedReason
      ? blockedLabels[house.blockedReason]
      : "",
  };
}
