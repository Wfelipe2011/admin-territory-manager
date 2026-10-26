"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  editConversation,
  editInterested,
  recordConversation,
  saveProfile,
} from "./store";
import {
  AddressDraft,
  Conversation,
  Interested,
  addressKey,
  addressLabel,
  localDateTime,
} from "./types";
import { useLocalAction, usePublisher } from "./use-publisher";

export const inputClass =
  "min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900";
export const actionClass =
  "min-h-12 rounded-xl bg-[var(--field-primary,#44783C)] px-4 text-white hover:bg-emerald-800";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function FormError({ error }: { error: string }) {
  return error ? (
    <p
      role="alert"
      className="break-words rounded-xl bg-red-50 p-3 text-sm text-red-800"
    >
      {error}
    </p>
  ) : null;
}

export function ProfileForm({
  initial = "",
  saved,
}: {
  initial?: string;
  saved?: () => void;
}) {
  const [name, setName] = useState(initial);
  const action = useLocalAction();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(() => saveProfile(name), saved);
      }}
    >
      <p className="text-sm text-slate-600">
        Seu nome e seus registros ficam somente neste navegador. Não é
        necessário criar uma conta.
      </p>
      <Field label="Seu nome">
        <Input
          autoFocus
          autoComplete="name"
          required
          maxLength={200}
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <FormError error={action.error} />
      <Button
        type="submit"
        disabled={action.busy}
        className={`${actionClass} w-full`}
      >
        {action.busy ? "Salvando…" : initial ? "Salvar nome" : "Começar"}
      </Button>
    </form>
  );
}

export function RecordConversationDialog({
  address,
  interestedId,
  close,
  saved,
  theme,
}: {
  address: AddressDraft | string;
  interestedId?: string;
  close: () => void;
  saved: () => void;
  theme?: CSSProperties;
}) {
  const { data, error } = usePublisher();
  const knownAddress =
    typeof address === "string"
      ? data?.addresses.find((item) => item.id === address)
      : data?.addresses.find(
          (item) => addressKey(item) === addressKey(address),
        );
  const label =
    typeof address === "string"
      ? knownAddress && addressLabel(knownAddress)
      : addressLabel(address);
  const people =
    data?.interested.filter(
      (item) => !item.deletedAt && item.addressId === knownAddress?.id,
    ) ?? [];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        style={theme}
        className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl"
      >
        <DialogTitle>
          {data && !data.profile
            ? "Seu cadastro de publicador"
            : "Registrar conversa"}
        </DialogTitle>
        <DialogDescription>
          {label || "Conversa salva somente neste aparelho."}
        </DialogDescription>
        <FormError error={error} />
        {!data ? (
          !error && <p role="status">Abrindo dados locais…</p>
        ) : !data.profile ? (
          <ProfileForm />
        ) : (
          <RecordForm
            address={address}
            people={people}
            initialInterestedId={interestedId}
            saved={saved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RecordForm({
  address,
  people,
  initialInterestedId,
  saved,
}: {
  address: AddressDraft | string;
  people: Interested[];
  initialInterestedId?: string;
  saved: () => void;
}) {
  const [selectedId, setSelectedId] = useState(initialInterestedId || "new");
  const selected = people.find((person) => person.id === selectedId);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [nextReturn, setNextReturn] = useState(selected?.nextReturn || "");
  const [text, setText] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => localDateTime());
  // Capture the version displayed in the editor; concurrent changes must not
  // silently overwrite a return date while this dialog is being completed.
  const [expected, setExpected] = useState(selected?.updatedAt);
  const action = useLocalAction();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(
          () =>
            recordConversation({
              address,
              interestedId: selectedId === "new" ? undefined : selectedId,
              interested:
                selectedId === "new"
                  ? { name, contact, nextReturn: nextReturn || null }
                  : undefined,
              ...(selectedId !== "new"
                ? {
                    nextReturn: nextReturn || null,
                    expectedInterestedUpdatedAt: expected,
                  }
                : {}),
              conversation: { text, occurredAt },
            }),
          saved,
        );
      }}
    >
      {!initialInterestedId && (
        <Field label="Interessado">
          <select
            autoFocus
            className={inputClass}
            value={selectedId}
            onChange={(event) => {
              const person = people.find(
                (person) => person.id === event.target.value,
              );
              setSelectedId(event.target.value);
              setNextReturn(person?.nextReturn || "");
              setExpected(person?.updatedAt);
            }}
          >
            <option value="new">Cadastrar novo interessado</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {initialInterestedId && (
        <p className="font-semibold">
          {selected?.name || "Interessado indisponível"}
        </p>
      )}
      {selectedId === "new" && (
        <>
          <Field label="Nome ou apelido">
            <Input
              required
              maxLength={200}
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Contato (opcional)">
            <Input
              maxLength={500}
              className={inputClass}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
            />
          </Field>
        </>
      )}
      <Field label="Data e hora da conversa">
        <input
          required
          type="datetime-local"
          className={inputClass}
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
        />
      </Field>
      <Field label="Anotações da conversa">
        <textarea
          required
          rows={4}
          maxLength={20000}
          className={inputClass}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      <Field label="Próximo retorno (opcional)">
        <input
          type="date"
          className={inputClass}
          value={nextReturn}
          onChange={(event) => setNextReturn(event.target.value)}
        />
      </Field>
      <FormError error={action.error} />
      <Button
        type="submit"
        disabled={action.busy || (selectedId !== "new" && !selected)}
        className={`${actionClass} w-full`}
      >
        {action.busy ? "Salvando…" : "Salvar conversa"}
      </Button>
    </form>
  );
}

export function EditInterestedDialog({
  person,
  close,
}: {
  person: Interested;
  close: () => void;
}) {
  const [name, setName] = useState(person.name);
  const [contact, setContact] = useState(person.contact);
  const [nextReturn, setNextReturn] = useState(person.nextReturn || "");
  const action = useLocalAction();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl">
        <DialogTitle>Editar interessado</DialogTitle>
        <DialogDescription>
          Corrija os dados salvos neste aparelho.
        </DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void action.run(
              () =>
                editInterested(
                  person.id,
                  { name, contact, nextReturn: nextReturn || null },
                  person.updatedAt,
                ),
              close,
            );
          }}
        >
          <Field label="Nome ou apelido">
            <Input
              autoFocus
              required
              maxLength={200}
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Contato (opcional)">
            <Input
              maxLength={500}
              className={inputClass}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
            />
          </Field>
          <Field label="Próximo retorno (opcional)">
            <input
              type="date"
              className={inputClass}
              value={nextReturn}
              onChange={(event) => setNextReturn(event.target.value)}
            />
          </Field>
          <FormError error={action.error} />
          <Button
            type="submit"
            disabled={action.busy}
            className={`${actionClass} w-full`}
          >
            Salvar cadastro
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditConversationDialog({
  conversation,
  close,
}: {
  conversation: Conversation;
  close: () => void;
}) {
  const [text, setText] = useState(conversation.text);
  const [occurredAt, setOccurredAt] = useState(() =>
    localDateTime(conversation.occurredAt),
  );
  const action = useLocalAction();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl">
        <DialogTitle>Editar conversa</DialogTitle>
        <DialogDescription>Corrija a data ou as anotações.</DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void action.run(
              () =>
                editConversation(
                  conversation.id,
                  { text, occurredAt },
                  conversation.updatedAt,
                ),
              close,
            );
          }}
        >
          <Field label="Data e hora da conversa">
            <input
              autoFocus
              required
              type="datetime-local"
              className={inputClass}
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </Field>
          <Field label="Anotações da conversa">
            <textarea
              required
              rows={6}
              maxLength={20000}
              className={inputClass}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
          <FormError error={action.error} />
          <Button
            type="submit"
            disabled={action.busy}
            className={`${actionClass} w-full`}
          >
            Salvar alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
