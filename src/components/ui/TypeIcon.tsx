import { iconMap } from "@/types/iconMap";
import { Building2, LucideProps } from "lucide-react";

type TypeIconProps = {
    type: string;
    size?: number;
} & LucideProps; // Aqui pegamos todas as props dos ícones da Lucide

export function TypeIcon({ type, size = 24, ...rest }: TypeIconProps) {
    const Icon = iconMap[type] || Building2;

    return <Icon size={size} {...rest} />;
}
