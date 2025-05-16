"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Providers } from "~/app/providers";

// Dynamically load Neynar components to disable SSR
const NeynarProvider = dynamic(
  () => import('./neynar-provider').then(mod => mod.NeynarProvider),
  { ssr: false }
);

export function NeynarClientWrapper({ children }: { children: ReactNode }) {
  return (
    <NeynarProvider>
      <Providers>{children}</Providers>
    </NeynarProvider>
  );
} 