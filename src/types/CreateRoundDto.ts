export interface CreateRoundDto {
    name: string;
    theme: "default" | "campaign";
    typeId: number;
    colorPrimary: string;
    colorSecondary: string;
}