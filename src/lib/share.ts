import toast from 'react-hot-toast';
export const navigatorShare = async (input: IShareInput): Promise<void> => {
  try {
    const can = navigator.canShare(input);
    if (!can) {
      toast.error('Não foi possível compartilhar');
      return;
    }
    await navigator.share(input);
  } catch (error) {
    toast.error('Erro ao compartilhar');
  }
};

export interface IShareInput {
  title: string;
  text: string;
  url?: string;
}
