import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';

// Contract addresses (deployed)
export const GAME_TOKEN_ADDRESS = '0x86dd3f7f20802b726fc24a8d9e8c9d4e74af3920';
export const GAME_SYSTEM_ADDRESS = '0x8db206c7f6ed8d1ce8053bf4d21600d43d435290';

// ABI for our GameToken contract
export const GAME_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "subtractedValue",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "addedValue",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ABI for our GameSystem contract
export const GAME_SYSTEM_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "btcAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "spermCoinsAmount",
        "type": "uint256"
      }
    ],
    "name": "BtcExchanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fid",
        "type": "uint256"
      }
    ],
    "name": "PlayerRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokensMinted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "addBtcToPlayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "btcAmount",
        "type": "uint256"
      }
    ],
    "name": "exchangeBtcForSperm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getBtcBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mintSpermTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "players",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isRegistered",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "fid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "btcBalance",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fid",
        "type": "uint256"
      }
    ],
    "name": "registerPlayer",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Create a public client to interact with the blockchain (read operations)
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http('https://rpc.monad-testnet.network'),
});

// Function to create a wallet client for a user (write operations)
export const createUserWalletClient = (privateKey: string) => {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http('https://rpc.monad-testnet.network'),
  });
};

// Check if a player is registered
export const isPlayerRegistered = async (playerAddress: string): Promise<boolean> => {
  try {
    const playerData = await publicClient.readContract({
      address: GAME_SYSTEM_ADDRESS as `0x${string}`,
      abi: GAME_SYSTEM_ABI,
      functionName: 'players',
      args: [playerAddress],
    }) as [boolean, bigint, bigint]; // Cast to expected return type [isRegistered, fid, btcBalance]
    
    return playerData[0]; // isRegistered field
  } catch (error) {
    console.error('Error checking player registration:', error);
    return false;
  }
};

// Register a player with their FID (Farcaster ID)
export const registerPlayer = async (
  walletClient: any,
  fid: number
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    // Registration costs 1 MON
    const hash = await walletClient.writeContract({
      address: GAME_SYSTEM_ADDRESS as `0x${string}`,
      abi: GAME_SYSTEM_ABI,
      functionName: 'registerPlayer',
      args: [fid],
      value: parseEther('1'),
    });
    
    return { success: true, hash };
  } catch (error) {
    console.error('Error registering player:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Get BTC balance for a player
export const getBtcBalance = async (playerAddress: string): Promise<number> => {
  try {
    const balance = await publicClient.readContract({
      address: GAME_SYSTEM_ADDRESS as `0x${string}`,
      abi: GAME_SYSTEM_ABI,
      functionName: 'getBtcBalance',
      args: [playerAddress],
    });
    
    return Number(balance);
  } catch (error) {
    console.error('Error getting BTC balance:', error);
    return 0;
  }
};

// Add BTC to a player's account (admin only)
export const addBtcToPlayer = async (
  walletClient: any,
  playerAddress: string,
  amount: number
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    const hash = await walletClient.writeContract({
      address: GAME_SYSTEM_ADDRESS as `0x${string}`,
      abi: GAME_SYSTEM_ABI,
      functionName: 'addBtcToPlayer',
      args: [playerAddress, amount],
    });
    
    return { success: true, hash };
  } catch (error) {
    console.error('Error adding BTC:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Exchange BTC for SPERM tokens
export const exchangeBtcForSperm = async (
  walletClient: any,
  btcAmount: number
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    const hash = await walletClient.writeContract({
      address: GAME_SYSTEM_ADDRESS as `0x${string}`,
      abi: GAME_SYSTEM_ABI,
      functionName: 'exchangeBtcForSperm',
      args: [btcAmount],
    });
    
    return { success: true, hash };
  } catch (error) {
    console.error('Error exchanging BTC for SPERM:', error);
    return { success: false, error: (error as Error).message };
  }
}; 