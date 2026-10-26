"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  FolderHeart,
  HelpCircle,
  MapPin,
  MessageSquarePlus,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CarIcon, PostAddIcon } from "./legacy-icons";

const triggerClass =
  "flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-[11px] text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800 data-[state=open]:bg-[var(--field-secondary)] data-[state=open]:text-[var(--field-primary)]";
const itemClass =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-800 hover:bg-[var(--field-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--field-primary)] disabled:opacity-50";
const iconClass = "h-[21px] w-[21px] shrink-0";

export function FieldFooter({
  block,
  theme,
  onMap,
  onDirections,
  onRecord,
  onReport,
  onShare,
  onHelp,
  sharing,
}: {
  block: boolean;
  theme: CSSProperties;
  onMap: () => void;
  onDirections: () => void;
  onRecord: () => void;
  onReport?: () => void;
  onShare?: () => void;
  onHelp: () => void;
  sharing: boolean;
}) {
  const [group, setGroup] = useState<"records" | "more" | null>(null);
  const transferringFocus = useRef(false);
  const recordsTrigger = useRef<HTMLButtonElement>(null);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const recordsLink = useRef<HTMLAnchorElement>(null);
  const run = (action: () => void, opensDialog = true) => {
    transferringFocus.current = opensDialog;
    if (opensDialog)
      (group === "records" ? recordsTrigger : moreTrigger).current?.focus();
    setGroup(null);
    action();
  };
  const closeAutoFocus = (event: Event) => {
    if (transferringFocus.current) event.preventDefault();
    transferringFocus.current = false;
  };
  return (
    <nav
      aria-label="Ações da área de campo"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_#00000008]"
    >
      <div className="mx-auto flex max-w-3xl items-stretch px-1">
        <button type="button" className={triggerClass} onClick={onMap}>
          <MapPin className={iconClass} aria-hidden />
          <span>Mapa</span>
        </button>
        {block ? (
          <>
            <button
              type="button"
              className={triggerClass}
              onClick={onDirections}
            >
              <CarIcon className={iconClass} aria-hidden />
              <span>Como chegar</span>
            </button>
            <Popover
              open={group === "records"}
              onOpenChange={(open) => setGroup(open ? "records" : null)}
            >
              <PopoverTrigger asChild>
                <button
                  ref={recordsTrigger}
                  type="button"
                  className={triggerClass}
                >
                  <FolderHeart className={iconClass} aria-hidden />
                  <span>Registros</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                style={theme}
                side="top"
                align="end"
                sideOffset={8}
                aria-label="Registros"
                className="w-64 max-w-[calc(100vw_-_2rem)] rounded-2xl p-2"
                onCloseAutoFocus={closeAutoFocus}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  recordsLink.current?.focus();
                }}
              >
                <p className="px-3 pb-1 pt-2 text-xs font-semibold text-slate-500">
                  Registros neste aparelho
                </p>
                <a
                  href="/publicador"
                  ref={recordsLink}
                  className={itemClass}
                  onClick={() => setGroup(null)}
                >
                  <FolderHeart className={iconClass} aria-hidden />
                  <span>Meus registros</span>
                </a>
                <button
                  type="button"
                  className={itemClass}
                  onClick={() => run(onRecord)}
                >
                  <MessageSquarePlus className={iconClass} aria-hidden />
                  <span>Registrar conversa</span>
                </button>
              </PopoverContent>
            </Popover>
            <Popover
              open={group === "more"}
              onOpenChange={(open) => setGroup(open ? "more" : null)}
            >
              <PopoverTrigger asChild>
                <button
                  ref={moreTrigger}
                  type="button"
                  className={triggerClass}
                >
                  <MoreHorizontal className={iconClass} aria-hidden />
                  <span>Mais</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                style={theme}
                side="top"
                align="end"
                sideOffset={8}
                aria-label="Mais opções"
                className="w-64 max-w-[calc(100vw_-_2rem)] rounded-2xl p-2"
                onCloseAutoFocus={closeAutoFocus}
              >
                <p className="px-3 pb-1 pt-2 text-xs font-semibold text-slate-500">
                  Mais opções
                </p>
                {onReport && (
                  <button
                    type="button"
                    className={itemClass}
                    onClick={() => run(onReport)}
                  >
                    <PostAddIcon className={iconClass} aria-hidden />
                    <span>Solicitar alteração</span>
                  </button>
                )}
                {onShare && (
                  <button
                    type="button"
                    className={itemClass}
                    disabled={sharing}
                    onClick={() => run(onShare, false)}
                  >
                    <Share2 className={iconClass} aria-hidden />
                    <span>Compartilhar</span>
                  </button>
                )}
                <button
                  type="button"
                  className={itemClass}
                  onClick={() => run(onHelp)}
                >
                  <HelpCircle className={iconClass} aria-hidden />
                  <span>Ajuda</span>
                </button>
              </PopoverContent>
            </Popover>
          </>
        ) : (
          <button type="button" className={triggerClass} onClick={onHelp}>
            <HelpCircle className={iconClass} aria-hidden />
            <span>Ajuda</span>
          </button>
        )}
      </div>
    </nav>
  );
}
