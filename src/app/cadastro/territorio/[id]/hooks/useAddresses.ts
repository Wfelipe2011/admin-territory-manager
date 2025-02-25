import { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
const axiosV1 = new AxiosAdapter(undefined, "v1");

export interface Address {
    id: number;
    name: string;
}
export const useAddresses = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    
    const fetchAddresses = useCallback(async () => {
        try {
            const response = await axiosV1.get<Address[]>(`addresses`);
            if (!response.data || response.status > 299) {
                throw new Error("Endereços não encontrados");
            }
            const addressesRaw = response.data
            const addressesWithoutDuplicates = addressesRaw.filter((address, index, self) =>
                index === self.findIndex((t) => t.name === address.name)
            );
            setAddresses(addressesWithoutDuplicates);
        } catch (error) {
            console.error(error);
        }
    }, []);
    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    return { addresses, setAddresses, fetchAddresses };
}