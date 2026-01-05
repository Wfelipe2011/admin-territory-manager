export interface Parameter {
    key: string;
    value: string;
    description: string;
}

export const PARAMETER_MAPPING = {
    SIGNATURE_EXPIRATION_HOURS: {
        label: "Validade do Link de Território",
        description: "Define por quantas horas o link enviado ao publicador permanecerá ativo.",
        suffix: "horas"
    },
    ROUND_START_DATE_MONTHS: {
        label: "Início da Rodada com Cartas",
        description: "Define quantos meses retroativos considerar para trabalhar com cartas.",
        suffix: "meses"
    }
} as const;

export type ParameterKey = keyof typeof PARAMETER_MAPPING;
