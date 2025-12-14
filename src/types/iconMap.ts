import { LucideIcon, Store, Building2, Home, Landmark, BookUser, Building, Hotel, Trees, Church, School, DoorClosed, BanIcon, House, Cross, Hospital as HospitalIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
    // Legendas principais do sistema
    "Testemunha de Jeová": Cross,
    "Não Bater": BanIcon,
    "Residência": House,
    Escola: School,
    Igreja: Church,
    Apartamento: Hotel,
    "Comércio": Store,
    Terreno: Trees,
    Hospital: HospitalIcon,
    Fundos: DoorClosed,

    // Compatibilidade com valores antigos
    Comercial: Store,
    Residencial: Home,
    "Predial-Externo": Building2,
    "Predial-Interno": Hotel,
    Prédios: Building,
    Interfone: BookUser,
    Rural: Landmark,
    Prédio: Building,
    Residencia: House,
    Predio: Building,
};
