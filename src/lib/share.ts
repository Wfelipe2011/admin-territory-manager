import toast from "react-hot-toast";
export const navigatorShare = async (input: IShareInput): Promise<void> => {
  if (navigator.share && (!navigator.canShare || navigator.canShare(input))) {
    try { await navigator.share(input); return; }
    catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
  }
  const value = [input.text, input.url].filter(Boolean).join('\n');
  if (!navigator.clipboard) throw new Error('Copie o link para compartilhar.');
  await navigator.clipboard.writeText(value);
  toast.success('Link copiado para compartilhar');
};

export interface IShareInput {
  title: string;
  text: string;
  url?: string;
}
