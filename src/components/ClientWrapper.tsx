'use client';

import dynamic from 'next/dynamic';

// Dynamically load the game component (CSR - Client-Side Rendering)
const SpermGame = dynamic(() => import('./SpermGame'), {
  ssr: false  // Disable Server-Side Rendering
});

export default function ClientWrapper() {
  return <SpermGame />;
} 