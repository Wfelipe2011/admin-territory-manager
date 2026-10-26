export type LocalEntity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PublisherProfile = LocalEntity & { name: string };
export type SavedAddress = LocalEntity & {
  source: string;
  tenantId: number;
  territoryId: number;
  blockId: number;
  streetId: number;
  mappingId: number | null;
  houseId: number;
  congregation: string;
  city: string;
  state: string;
  territory: string;
  block: string;
  street: string;
  number: string;
  complement: string;
};
export type AddressDraft = Omit<SavedAddress, keyof LocalEntity>;
export type Interested = LocalEntity & {
  addressId: string;
  name: string;
  contact: string;
  nextReturn: string | null;
  deletedAt: string | null;
};
export type Conversation = LocalEntity & {
  interestedId: string;
  text: string;
  occurredAt: string;
  deletedAt: string | null;
};
export type PublisherData = {
  revision: number;
  profile: PublisherProfile | null;
  addresses: SavedAddress[];
  interested: Interested[];
  conversations: Conversation[];
};
export type PublisherFile = {
  format: "territorio-digital-publicador";
  version: 1;
  kind: "backup" | "interested";
  exportedAt: string;
  profile: PublisherProfile | null;
  addresses: SavedAddress[];
  interested: Interested[];
  conversations: Conversation[];
};
export const emptyData = (): PublisherData => ({
  revision: 0,
  profile: null,
  addresses: [],
  interested: [],
  conversations: [],
});
export const quantity = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => `${count} ${count === 1 ? singular : plural}`;
export const addressLabel = (address: SavedAddress | AddressDraft) =>
  `${address.street}, ${address.number}${address.complement ? ` · ${address.complement}` : ""}`;
export const addressKey = (address: AddressDraft) =>
  JSON.stringify([
    address.source,
    address.tenantId,
    address.territoryId,
    address.blockId,
    address.mappingId ?? `street:${address.streetId}`,
    address.houseId,
  ]);
export const localDateTime = (iso = new Date().toISOString()) => {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
