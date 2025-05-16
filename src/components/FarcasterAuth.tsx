import { useState, useEffect } from 'react';
import NeynarButton from '~/components/ui/NeynarButton';

interface FarcasterAuthProps {
  onSignIn?: (user: FarcasterUser) => void;
}

// Type definition for user from Farcaster
interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfp?: string;
  wallet?: {
    address: string;
  };
}

export default function FarcasterAuth({ onSignIn }: FarcasterAuthProps) {
  const [userData, setUserData] = useState<FarcasterUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle Farcaster sign-in success
  const handleSignInSuccess = (user: Record<string, any>) => {
    if (user) {
      const newUserData: FarcasterUser = {
        fid: user.fid || 0,
        username: user.username || `user_${user.fid}`,
        displayName: user.displayName,
        pfp: user.pfpUrl,
        wallet: {
          address: user.wallet?.address || '',
        }
      };
      
      setUserData(newUserData);
      setIsConnected(true);
      
      if (onSignIn) onSignIn(newUserData);
    }
  };
  
  // Handle browser wallet connection
  const connectBrowserWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if MetaMask or other wallet is available
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
          const mockUser = {
            fid: 0, // No FID for web3 wallets
            username: `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
            wallet: {
              address: accounts[0],
            }
          };
          
          handleSignInSuccess(mockUser);
        } else {
          throw new Error("No accounts found");
        }
      } else {
        throw new Error("No web3 wallet detected. Please install MetaMask or another wallet");
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Wallet connection error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sign-out
  const handleSignOut = () => {
    setUserData(null);
    setIsConnected(false);
  };
  
  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  return (
    <div className="w-full">
      {!isConnected ? (
        <div className="text-center">
          {isMobile ? (
            <div className="flex justify-center">
              <NeynarButton 
                onSuccess={handleSignInSuccess} 
                className="w-full"
              />
            </div>
          ) : (
            <button
              onClick={connectBrowserWallet}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl text-white font-bold text-lg transform transition-all hover:scale-105 active:scale-95 shadow-lg"
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
              ) : "CONNECT WALLET"}
            </button>
          )}
          
          {error && (
            <div className="mt-3 bg-red-400 bg-opacity-25 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">
                <span className="opacity-80 text-sm">Connected as:</span>
                <span className="block font-bold">{userData?.displayName || userData?.username || 'User'}</span>
              </p>
              {userData?.wallet?.address && (
                <p className="text-xs text-pink-100 mt-1">
                  {userData.wallet.address.substring(0, 6)}...{userData.wallet.address.substring(38)}
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-lg text-xs font-bold shadow-md transform transition-all hover:scale-105 active:scale-95"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              DISCONNECT
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 