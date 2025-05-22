"use client";

import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { PageTitle } from "@/components/ui/PageTitle";
import { useEffect, useState } from "react";
import MetabaseIframe from "@/components/MetabaseIframe";

let timer: NodeJS.Timeout;
const DashboardPage = () => {
  const [mode, setMode] = useState<MODE>(MODE.LOADING);

  useEffect(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      setMode(MODE.SCREEN)
    }, 2000);
  }, []);
  return (
    <RootModeScreen mode={mode}>
      <PageTitle title="Dashboard" />
      <MetabaseIframe />
    </RootModeScreen>
  );
};

export default DashboardPage;
