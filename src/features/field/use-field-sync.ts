"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FieldError, fieldApiUrl, fieldIdentity, fieldRequest } from "./api";
import {
  BlockSnapshot,
  Block,
  FieldSession,
  House,
  Presence,
  ScreenScope,
  Snapshot,
  SyncResponse,
} from "./types";
import { houseAction } from "./house-permissions";

export function useFieldSync(session: FieldSession | null, scope: ScreenScope) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [presence, setPresence] = useState<Presence>({
    total: 0,
    blocks: {},
    streets: {},
  });
  const [status, setStatus] = useState<
    "loading" | "live" | "reconnecting" | "offline"
  >("loading");
  const [fatal, setFatal] = useState("");
  const [generation, setGeneration] = useState(0);
  const [busy, setBusy] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const pending = useRef(new Set<number>());
  const writeEpoch = useRef(0);
  const refresh = useCallback(() => setGeneration((value) => value + 1), []);
  const updateBlockSignature = (id: number, signature: Block["signature"]) => {
    setData((old) => old && ({
      ...old,
      blocks: old.blocks.map((block) => block.id === id ? { ...block, signature } : block),
      block: old.block?.id === id ? { ...old.block, signature } : old.block,
    }));
  };
  const { scope: kind, blockId } = scope;

  useEffect(() => {
    setNow(Date.now());
  }, [data]);

  useEffect(() => {
    const time = Date.now();
    const deadlines =
      data?.streets
        .flatMap((street) =>
          street.houses
            .filter((house) => house.canUnmark && house.canUnmarkUntil)
            .map((house) => Date.parse(house.canUnmarkUntil!)),
        )
        .filter((value) => value > time) ?? [];
    if (!deadlines.length) return;
    const timer = window.setTimeout(
      () => {
        setNow(Date.now());
        refresh();
      },
      Math.min(Math.max(1, Math.min(...deadlines) - time), 2147483647),
    );
    return () => clearTimeout(timer);
  }, [data, now, refresh]);

  useEffect(() => {
    if (!session) return;
    const identity = fieldIdentity();
    const leave = () => {
      void fetch(
        `${fieldApiUrl}/field/session?${new URLSearchParams(identity)}`,
        {
          method: "DELETE",
          credentials: "omit",
          headers: { Authorization: `Bearer ${session.token}` },
          keepalive: true,
        },
      ).catch(() => {});
    };
    const listener = () => {
      setNow(Date.now());
      refresh();
      if (document.hidden || !navigator.onLine) leave();
    };
    document.addEventListener("visibilitychange", listener);
    window.addEventListener("online", listener);
    window.addEventListener("offline", listener);
    return () => {
      document.removeEventListener("visibilitychange", listener);
      window.removeEventListener("online", listener);
      window.removeEventListener("offline", listener);
      leave();
    };
  }, [session, refresh]);

  useEffect(() => {
    setData(null);
    setFatal("");
    setLastSyncedAt(null);
  }, [session, kind, blockId]);

  useEffect(() => {
    if (!session || fatal || busy) return;
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    if (document.hidden) return;
    const abort = new AbortController();
    const identity = fieldIdentity();
    const params = new URLSearchParams({
      ...identity,
      ...(kind === "territory" ? { scope: kind } : {}),
    });
    const endpoint =
      kind === "block" ? `field/blocks/${blockId}/sync` : "field/sync";
    let cursor: string | undefined;
    let retry = 1000;
    let stopSleep: (() => void) | undefined;
    let request: AbortController | undefined;

    const run = async () => {
      while (!abort.signal.aborted) {
        request = new AbortController();
        const timeout = window.setTimeout(() => request?.abort(), 35000);
        try {
          if (cursor === undefined) params.delete("cursor");
          else params.set("cursor", cursor);
          const epoch = writeEpoch.current;
          const result = await fieldRequest<
            SyncResponse<Snapshot | BlockSnapshot>
          >(`${endpoint}?${params}`, session, {
            signal: request.signal,
            timeoutMs: 35000,
          });
          if (abort.signal.aborted) break;
          if (epoch !== writeEpoch.current) {
            cursor = undefined;
            continue;
          }
          if (result.changed && result.data)
            setData({
              ...result.data,
              blocks:
                "blocks" in result.data
                  ? result.data.blocks
                  : result.data.block
                  ? [result.data.block]
                  : [],
            });
          cursor = result.cursor;
          setPresence(result.presence);
          setLastSyncedAt(Date.now());
          setStatus("live");
          retry = 1000;
        } catch (error) {
          if (abort.signal.aborted) break;
          if (
            error instanceof FieldError &&
            [401, 403, 404, 410].includes(error.status)
          ) {
            setFatal(error.message);
            break;
          }
          setStatus(navigator.onLine ? "reconnecting" : "offline");
          cursor = undefined;
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(
              resolve,
              retry + Math.random() * retry * 0.2,
            );
            stopSleep = () => {
              clearTimeout(timer);
              resolve();
            };
          });
          retry = Math.min(15000, retry * 2);
        } finally {
          clearTimeout(timeout);
        }
      }
    };
    void run();
    return () => {
      abort.abort();
      request?.abort();
      stopSleep?.();
    };
  }, [session, kind, blockId, generation, busy, fatal]);

  const mark = async (house: House, addressId: number) => {
    if (!session || !data?.workRoundNumber || pending.current.has(house.id))
      return;
    if (!navigator.onLine)
      throw new Error("Sem conexão. Aguarde a internet voltar para registrar.");
    if (!houseAction(house, Date.now()).allowed)
      throw new Error(
        "Esta casa não está disponível para essa ação. Atualize para conferir.",
      );
    pending.current.add(house.id);
    writeEpoch.current++;
    setBusy((value) => value + 1); // Pause snapshots until writes finish, preventing optimistic-state races.
    const updateLocal = (status: boolean) =>
      setData((old) => {
        if (!old) return old;
        const streets = old.streets.map((street) => {
          if (street.id !== addressId) return street;
          const houses = street.houses.map((h) =>
            h.id === house.id ? { ...h, status } : h,
          );
          const completed = houses.filter((h) => h.status).length;
          return {
            ...street,
            houses,
            completed,
            pending: houses.filter((h) => h.hasRound).length - completed,
          };
        });
        const completed = streets.reduce(
          (sum, street) => sum + street.completed,
          0,
        );
        return {
          ...old,
          streets,
          block: old.block && {
            ...old.block,
            completed,
            pending: old.block.total - completed,
          },
        };
      });
    updateLocal(!house.status);
    try {
      await fieldRequest(
        `territories/${session.access.territoryId}/blocks/${blockId}/address/${addressId}/houses/${house.id}`,
        session,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: !house.status,
            round: data.workRoundNumber,
          }),
          timeoutMs: 30000,
        },
      );
    } catch (error) {
      updateLocal(house.status);
      throw error;
    } finally {
      writeEpoch.current++;
      pending.current.delete(house.id);
      setBusy((value) => value - 1);
    }
  };
  return {
    data,
    presence,
    status,
    fatal,
    refresh,
    mark,
    pending: pending.current,
    now,
    lastSyncedAt,
    updateBlockSignature,
  };
}
