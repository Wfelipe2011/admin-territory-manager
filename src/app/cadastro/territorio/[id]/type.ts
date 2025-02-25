interface Territory {
    name: string;
    imageUrl: string;
    house: House[];
    totalHouse: number;
    typeName: string;
}

interface House {
    id: number;
    dontVisit: boolean;
    legend: string;
    number: string;
    street: string;
    observations: string | null;
    order: number;
}

// interface TerritoryHistory {
//     overseer: string;
//     initialDate: string;
//     expirationDate: string;
//     finished: boolean;
// }

// interface TerritoryBlock {
//     id: number;
//     name: string;
//     positiveCompleted: number;
//     negativeCompleted: number;
//     connections: number[];
//     signature: {
//         key: string;
//         expirationDate: string;
//     }
// }

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

export type { Territory, Block, BlockAddress, House }