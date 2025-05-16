"use client";

import { useState } from 'react';

interface NeynarButtonProps {
  onSuccess?: (user: Record<string, any>) => void;
  className?: string;
}

export default function NeynarButton({ onSuccess, className }: NeynarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize Farcaster auth with the seed phrase
  const handleFarcasterSignIn = async () => {
    setIsLoading(true);
    
    try {
      // The seed phrase would normally be stored securely in environment variables
      const seedPhrase = "machine universe hard parent sleep tongue voyage glory glare win lunar fault picture vote coach excuse woman screen puzzle slot edge broom weekend pen";
      
      // In a production environment, we would use the real Neynar SDK here
      // For now, we'll simulate a successful authentication
      
      // Mock wait for API response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create a user object based on the Farcaster authentication
      const farcasterUser = {
        fid: 12345, // This would be a real FID in production
        username: 'spermfarcaster_user',
        displayName: 'SpermFarcaster Player',
        pfpUrl: '/game-assets/logo.png',
        wallet: {
          address: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
        }
      };
      
      // Pass the authenticated user data back to the parent component
      if (onSuccess) {
        onSuccess(farcasterUser);
      }
      
      console.log("Farcaster authentication successful with seed phrase", seedPhrase.split(' ').slice(0, 3).join(' ') + '...');
    } catch (error) {
      console.error("Farcaster authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={className}>
      <button 
        onClick={handleFarcasterSignIn}
        disabled={isLoading}
        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            CONNECTING...
          </div>
        ) : (
          <>
            <svg 
              className="w-6 h-6 mr-3" 
              viewBox="0 0 32 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Farcaster logo */}
              <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2"/>
              <path d="M10 13L16 18L22 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 19L16 24L22 19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            CONNECT WITH FARCASTER
          </>
        )}
      </button>
    </div>
  );
} 