import { LucideIcon, Store, Building2, Home, Landmark, BookUser, Building, Hotel } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
    Comercial: Store,
    Residencial: Home,
    "Predial-Externo": Building2,
    "Predial-Interno": Hotel,
    Prédios: Building,
    Interfone: BookUser,
    Rural: Landmark,
};
