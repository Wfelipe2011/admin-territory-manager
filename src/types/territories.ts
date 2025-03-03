export type TerritoryType = {
    id: number;
    name: string;
    tenantId: number;
}

export type Territories = {
    territoryId: number;
    typeId: number;
    name: string;
    overseer: string | null;
    signature: {
        expirationDate: string | null;
        key: string | null;
    };
    hasRounds: boolean;
    negativeCompleted: number;
    positiveCompleted: {
        date: string;
        period: string;
    }[];
}

export type Round = {
    id: number;
    round_number: number;
    name: string;
    type: string;
    theme: string;
    tenant_id: number;
    color_primary: string;
    color_secondary: string;
    start_date: string;
    end_date: string | null;
    completed: number;
    not_completed: number;
};