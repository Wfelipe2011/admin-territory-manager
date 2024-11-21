export interface Territory {
  id: number;
  imageUrl: string;
  name: string;
  tenantId: number;
  typeId: number;
  type: { id: number; name: string; tenantId: number };
}

export interface TerritoryTypes {
  id: number;
  name: string;
  tenantId: number;
}
