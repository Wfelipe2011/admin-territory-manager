interface Territory {
    territoryId: number;
    territoryName: string;
    imageUrl: string;
    hasRounds: boolean;
    history: TerritoryHistory[];
    blocks: TerritoryBlock[];
}

interface TerritoryHistory {
    overseer: string;
    initialDate: string;
    expirationDate: string;
    finished: boolean;
}

interface TerritoryBlock {
    id: number;
    name: string;
    positiveCompleted: number;
    negativeCompleted: number;
    connections: number[];
    signature: {
        key: string;
        expirationDate: string;
    }
}

interface Block {
    id: number;
    name: string;
    addresses: BlockAddress[];
}

interface BlockAddress {
    id: number;
    street: string;
    zipCode: string;
}

export type { Territory, Block, BlockAddress }