export const formatZipCode = (value: string | null) => {
    if (!value) {
        return "";
    }
    const valueRaw = value.replace(/\D/g, '');
    return valueRaw.replace(/(\d{5})(\d{3})/, "$1-$2");
}