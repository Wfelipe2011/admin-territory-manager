interface Territory {
    territoryId: number;
    territoryName: string;
    imageUrl: string;
    hasRounds: boolean;
    history: History[];
    blocks: Block[];
}

interface History {
    overseer: string;
    initialDate: string;
    expirationDate: string;
    finished: boolean;
}

interface Block {
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

export type { Territory }