'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function MiniAppRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Prevent scrolling/zooming on iOS
    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    // Short timeout to ensure the page is loaded before redirecting
    const redirectTimer = setTimeout(() => {
      // Redirect to the main page
      router.push('/');
    }, 1500);
    
    return () => {
      clearTimeout(redirectTimer);
      document.removeEventListener('touchmove', (e) => {
        e.preventDefault();
      });
    };
  }, [router]);
  
  return (
    <div 
      className="mini-app-loading"
      onTouchStart={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
    >
      <Image 
        src="/og-image.png"
        alt="Sperm Invaders Survival"
        width={200}
        height={200}
        priority
      />
      <p>Loading game...</p>
    </div>
  );
} 