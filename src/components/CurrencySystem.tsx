import { useEffect, useState } from 'react';

// Egg Types and their properties
export enum EggType {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  DIAMOND = 'diamond'
}

export interface Egg {
  type: EggType;
  cost: number;
  spawnRate: number;
  minReward: number;
  maxReward: number;
  emptyChance: number;
}

// Egg configuration
export const EGGS: Record<EggType, Egg> = {
  [EggType.BRONZE]: {
    type: EggType.BRONZE,
    cost: 5,
    spawnRate: 0.5, // 50% chance to spawn
    minReward: 1,
    maxReward: 10,
    emptyChance: 0.4 // 40% chance to be empty
  },
  [EggType.SILVER]: {
    type: EggType.SILVER,
    cost: 15,
    spawnRate: 0.3, // 30% chance to spawn
    minReward: 5,
    maxReward: 25,
    emptyChance: 0.3 // 30% chance to be empty
  },
  [EggType.GOLD]: {
    type: EggType.GOLD,
    cost: 30,
    spawnRate: 0.15, // 15% chance to spawn
    minReward: 20,
    maxReward: 50,
    emptyChance: 0.2 // 20% chance to be empty
  },
  [EggType.DIAMOND]: {
    type: EggType.DIAMOND,
    cost: 50,
    spawnRate: 0.05, // 5% chance to spawn
    minReward: 50,
    maxReward: 100,
    emptyChance: 0.1 // 10% chance to be empty
  }
};

// For character unlocking
export const CHARACTER_PRICES = {
  neo: 0, // Free/default character
  naruto: 100,
  flash: 200,
  elon: 300,
  superman: 400,
  trump: 500
};

export interface CurrencySystemProps {
  onCurrencyUpdate?: (amount: number) => void;
}

export default function CurrencySystem({ onCurrencyUpdate }: CurrencySystemProps) {
  const [currency, setCurrency] = useState<number>(0);
  const [unlockedCharacters, setUnlockedCharacters] = useState<Record<string, boolean>>({
    neo: true // Neo is always unlocked by default
  });

  // Load saved currency and unlocked characters
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('spermGameCurrency');
      if (savedCurrency) {
        setCurrency(Number(savedCurrency));
      }

      const savedUnlocked = localStorage.getItem('spermGameUnlockedChars');
      if (savedUnlocked) {
        setUnlockedCharacters(JSON.parse(savedUnlocked));
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Save currency and unlocked characters when they change
  useEffect(() => {
    try {
      localStorage.setItem('spermGameCurrency', currency.toString());
      localStorage.setItem('spermGameUnlockedChars', JSON.stringify(unlockedCharacters));
    } catch (e) {
      // Ignore errors
    }
    
    if (onCurrencyUpdate) {
      onCurrencyUpdate(currency);
    }
  }, [currency, unlockedCharacters, onCurrencyUpdate]);

  // Add currency
  const addCurrency = (amount: number) => {
    setCurrency(prev => prev + amount);
  };

  // Deduct currency
  const deductCurrency = (amount: number): boolean => {
    if (currency >= amount) {
      setCurrency(prev => prev - amount);
      return true;
    }
    return false;
  };

  // Open an egg
  const openEgg = (eggType: EggType): { success: boolean; reward?: number; isEmpty?: boolean } => {
    const egg = EGGS[eggType];
    
    // Check if we have enough currency
    if (!deductCurrency(egg.cost)) {
      return { success: false };
    }
    
    // Check if egg is empty
    const isEmpty = Math.random() < egg.emptyChance;
    if (isEmpty) {
      return { success: true, isEmpty: true };
    }
    
    // Calculate reward
    const reward = Math.floor(
      egg.minReward + Math.random() * (egg.maxReward - egg.minReward + 1)
    );
    
    // Add reward to currency
    addCurrency(reward);
    
    return { success: true, reward };
  };

  // Unlock a character
  const unlockCharacter = (characterId: string, price: number): boolean => {
    // Check if already unlocked
    if (unlockedCharacters[characterId]) {
      return true;
    }
    
    // Try to purchase
    if (deductCurrency(price)) {
      setUnlockedCharacters(prev => ({
        ...prev,
        [characterId]: true
      }));
      return true;
    }
    
    return false;
  };

  // Check if a character is unlocked
  const isCharacterUnlocked = (characterId: string): boolean => {
    return !!unlockedCharacters[characterId];
  };

  // Generate a random egg based on spawn rates
  const generateRandomEgg = (): EggType | null => {
    const eggTypes = Object.values(EggType);
    for (const eggType of eggTypes) {
      if (Math.random() < EGGS[eggType].spawnRate) {
        return eggType;
      }
    }
    return null;
  };

  return {
    currency,
    addCurrency,
    deductCurrency,
    openEgg,
    unlockCharacter,
    isCharacterUnlocked,
    generateRandomEgg
  };
} 