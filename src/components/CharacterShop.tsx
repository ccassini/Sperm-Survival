import { useState } from 'react';
import { CHARACTER_PRICES } from './CurrencySystem';

interface Character {
  id: string;
  name: string;
  imagePrefix: string;
  frameCount: number;
  description?: string;
  color?: string;
  special?: string;
  price: number; // Price in BTC satoshis
}

interface CharacterShopProps {
  characters: Character[];
  btcBalance: number;
  selectedCharacter: string; 
  unlockedCharacters: Record<string, boolean>;
  onSelectCharacter: (characterId: string) => void;
  onUnlockCharacter: (characterId: string, price: number) => boolean;
}

export default function CharacterShop({
  characters,
  btcBalance,
  selectedCharacter,
  unlockedCharacters,
  onSelectCharacter,
  onUnlockCharacter
}: CharacterShopProps) {
  const [message, setMessage] = useState<{ text: string; isError: boolean; visible: boolean }>({
    text: '',
    isError: false,
    visible: false
  });

  // Format BTC amount for display (from satoshis to BTC)
  const formatBtc = (satoshis: number): string => {
    return (satoshis / 1e8).toFixed(8);
  };

  // Display a message for a short time
  const showMessage = (text: string, isError: boolean) => {
    setMessage({
      text,
      isError,
      visible: true
    });
    
    setTimeout(() => {
      setMessage(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  // Handle character selection/unlock
  const handleCharacterClick = (character: Character) => {
    if (unlockedCharacters[character.id]) {
      // Character is already unlocked, select it
      onSelectCharacter(character.id);
      showMessage(`Selected ${character.name}!`, false);
    } else {
      // Try to unlock the character with BTC
      const success = onUnlockCharacter(character.id, character.price);
      if (success) {
        onSelectCharacter(character.id);
        showMessage(`Unlocked ${character.name}!`, false);
      } else {
        showMessage(`Not enough BTC to unlock ${character.name}!`, true);
      }
    }
  };

  return (
    <div className="mb-4 p-4 bg-pink-100 rounded-lg border-2 border-pink-300">
      <h3 className="text-pink-800 font-bold mb-2 text-center" style={{ fontFamily: "'Eater', cursive" }}>
        Character Shop
      </h3>
      
      <div className="text-center mb-3">
        <p className="text-orange-500 font-bold">BTC Balance: {formatBtc(btcBalance)} BTC</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {characters.map(character => (
          <div 
            key={character.id}
            className={`p-2 ${
              selectedCharacter === character.id 
              ? 'bg-pink-300 border-2 border-pink-500' 
              : 'bg-pink-50 border border-pink-200'
            } rounded-lg cursor-pointer`}
            onClick={() => handleCharacterClick(character)}
          >
            <div className="flex flex-col items-center">
              <img 
                src={`/game-assets/${character.imagePrefix}-1.png`}
                alt={character.name} 
                className="w-12 h-12 object-contain"
              />
              <p className="mt-1 text-pink-700 font-semibold text-sm">
                {character.name}
              </p>
              
              {!unlockedCharacters[character.id] ? (
                <div className="mt-1 w-full">
                  <p className="text-xs text-orange-500 font-bold">
                    Price: {formatBtc(character.price)} BTC
                  </p>
                  <button
                    className={`mt-1 w-full px-2 py-1 text-xs rounded-lg font-bold ${
                      btcBalance >= character.price 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                    disabled={btcBalance < character.price}
                    style={{ fontFamily: "'Eater', cursive" }}
                  >
                    Unlock
                  </button>
                </div>
              ) : (
                <p className={`mt-1 text-xs ${
                  selectedCharacter === character.id ? 'text-white' : 'text-green-600'
                } font-bold`}>
                  {selectedCharacter === character.id ? 'Selected' : 'Unlocked'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Message popup */}
      {message.visible && (
        <div className={`fixed top-1/4 left-1/2 transform -translate-x-1/2 p-3 rounded-lg text-center text-white font-bold z-50 ${
          message.isError ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
} 