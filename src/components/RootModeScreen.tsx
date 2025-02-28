"use client"
import { Toaster } from 'react-hot-toast';
import { SpiralLoader } from './ui/spiral';

function Loading() {
  return (
    <main>
      <section className='bg-gray-50'>
        <div className='layout flex min-h-screen flex-col items-center justify-center text-center text-black'>
          <SpiralLoader />
        </div>
      </section>
    </main>
  );
}

export enum MODE {
  SCREEN = 'screen',
  LOADING = 'loading',
}

export const RootModeScreen = ({ children, mode }: { mode: MODE, children: React.ReactNode }) => {
  const projectVersion = 'v2.0.0';
  return (
    <div className="w-full mt-14 bg-gray-100 px-2">
      <Toaster />
      {mode === 'loading' && <Loading />}
      {mode === 'screen' && children}
      <div
        className="fixed bottom-0 left-0 p-1 m-1 bg-gray-400 text-white text-sm rounded"
        data-tip=" 
        "
        id="versionTooltip"
      >
        Versão: {projectVersion}
      </div>
      {/* <Tooltip
        anchorSelect="#versionTooltip"
        openOnClick={true}
        place="top"
      >
        Versão 2.0.0
      </Tooltip> */}
    </div>
  );
};