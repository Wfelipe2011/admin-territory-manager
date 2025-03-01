import { MODE } from "@/components/RootModeScreen";
import { useState } from "react";

export const useMode = () => {
  const [mode, setMode] = useState<MODE>(MODE.LOADING);

  return { mode, setMode, options: MODE };
};
