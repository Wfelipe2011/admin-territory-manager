import { LucideIcon, Store, Building2, Home, Landmark, BookUser, Building, Hotel, Trees, Church, School, DoorClosed, BanIcon, Building as BuildingIcon, House, HomeIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
    Comercial: Store,
    Residencial: Home,
    "Predial-Externo": Building2,
    "Predial-Interno": Hotel,
    Prédios: Building,
    Interfone: BookUser,
    Rural: Landmark,
    Terreno: Trees,
    Igreja: Church,
    Escola: School,
    Fundos: DoorClosed,
    "Não Bater": BanIcon,
    Prédio: Building,
    Residencia: House,
    Apartamento: Hotel,
    Predio: BuildingIcon,
    Vila: HomeIcon,
};
