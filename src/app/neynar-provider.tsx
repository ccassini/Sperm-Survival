"use client";

import { ReactNode } from 'react';

// In version 0.7.0 there's no NeynarProvider
// We're creating a minimal wrapper that just renders children
interface NeynarProviderProps {
  children: ReactNode;
}

export function NeynarProvider({ children }: NeynarProviderProps) {
  // In version 0.7.0, there's no provider component
  // The NeynarAuthButton works without a provider
  return <>{children}</>;
} 