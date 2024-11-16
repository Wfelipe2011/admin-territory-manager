import toast from "react-hot-toast";
export const navigatorShare = async (input: IShareInput): Promise<void> => {
  const can = navigator.canShare(input);
  if (!can) {
    toast.error("Não foi possível compartilhar");
    return;
  }
  await navigator.share(input);
};

export interface IShareInput {
  title: string;
  text: string;
  url?: string;
}
