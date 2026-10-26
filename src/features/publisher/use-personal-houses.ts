"use client";

import { useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { fieldApiUrl } from "@/features/field/api";
import type { FieldSession } from "@/features/field/types";
import { usePublisher } from "./use-publisher";

/** Local indicators only: never annotate the server snapshot or send house IDs. */
export function usePersonalHouses(
  session: FieldSession | null,
  blockId?: number,
) {
  const { data } = usePublisher();
  return useMemo(() => {
    const houses = new Set<number>();
    if (!session || !blockId || !data) return houses;
    try {
      const { tenantId } = jwtDecode<{ tenantId: number }>(session.token);
      const url = new URL(fieldApiUrl, window.location.origin);
      const source = `${url.origin}${url.pathname.replace(/\/$/, "")}`;
      const activeAddresses = new Set(
        data.interested
          .filter((person) => !person.deletedAt)
          .map((person) => person.addressId),
      );
      for (const address of data.addresses) {
        if (
          activeAddresses.has(address.id) &&
          address.source === source &&
          address.tenantId === tenantId &&
          address.territoryId === session.access.territoryId &&
          address.blockId === blockId
        )
          houses.add(address.houseId);
      }
    } catch {
      /* A missing/invalid field session never grants a local match. */
    }
    return houses;
  }, [data, session, blockId]);
}
