import { useState, useEffect } from 'react';
import { EggType, EGGS } from './CurrencySystem';

interface EggSystemProps {
  currency: number;
  btcBalance: number;
  openEgg: (eggType: EggType) => { success: boolean; btcReward?: number; isEmpty?: boolean };
  generateRandomEgg: () => EggType | null;
  onCurrencyUpdate: (amount: number) => void;
  onBtcUpdate: (amount: number) => void;
}

export default function EggSystem({ 
  currency, 
  btcBalance, 
  openEgg, 
  generateRandomEgg, 
  onCurrencyUpdate, 
  onBtcUpdate 
}: EggSystemProps) {
  const [randomEgg, setRandomEgg] = useState<EggType | null>(null);
  const [eggTimer, setEggTimer] = useState<number>(0);
  const [openResult, setOpenResult] = useState<{ 
    type?: EggType; 
    btcReward?: number; 
    isEmpty?: boolean;
    success: boolean;
    visible: boolean;
  }>({ success: false, visible: false });

  // Generate a random egg every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setEggTimer(prev => {
        const newTime = prev + 1;
        if (newTime >= 60) {
          const newEgg = generateRandomEgg();
          setRandomEgg(newEgg);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [generateRandomEgg]);

  // Handle opening an egg
  const handleOpenEgg = (eggType: EggType) => {
    const result = openEgg(eggType);
    
    if (result.success) {
      setOpenResult({
        type: eggType,
        btcReward: result.btcReward,
        isEmpty: result.isEmpty,
        success: true,
        visible: true
      });
      
      // Clear the random egg if that's what was opened
      if (randomEgg === eggType) {
        setRandomEgg(null);
      }
      
      // Hide the result after 3 seconds
      setTimeout(() => {
        setOpenResult(prev => ({ ...prev, visible: false }));
      }, 3000);
    } else {
      setOpenResult({
        success: false,
        visible: true
      });
      
      // Hide the result after 2 seconds
      setTimeout(() => {
        setOpenResult(prev => ({ ...prev, visible: false }));
      }, 2000);
    }
  };

  // Get egg color based on type
  const getEggColor = (eggType: EggType): string => {
    switch (eggType) {
      case EggType.BRONZE: return 'from-yellow-700 to-yellow-800';
      case EggType.SILVER: return 'from-gray-300 to-gray-400';
      case EggType.GOLD: return 'from-yellow-300 to-yellow-500';
      case EggType.DIAMOND: return 'from-blue-300 to-blue-500';
      default: return 'from-gray-300 to-gray-400';
    }
  };

  // Get egg border color based on type
  const getEggBorderColor = (eggType: EggType): string => {
    switch (eggType) {
      case EggType.BRONZE: return 'border-yellow-600';
      case EggType.SILVER: return 'border-gray-500';
      case EggType.GOLD: return 'border-yellow-400';
      case EggType.DIAMOND: return 'border-blue-400';
      default: return 'border-gray-400';
    }
  };

  // Get egg emoji based on type
  const getEggEmoji = (eggType: EggType): string => {
    switch (eggType) {
      case EggType.BRONZE: return '🥉';
      case EggType.SILVER: return '🥈';
      case EggType.GOLD: return '🥇';
      case EggType.DIAMOND: return '💎';
      default: return '🥚';
    }
  };

  // Format BTC amount for display (from satoshis to BTC)
  const formatBtc = (satoshis: number): string => {
    return (satoshis / 1e8).toFixed(8);
  };

  return (
    <div className="mt-4">
      {/* BTC Balance Display */}
      <div className="mb-4 text-center">
        <p className="text-orange-500 font-bold">
          BTC Balance: {formatBtc(btcBalance)} BTC
        </p>
      </div>
      
      {/* Random egg that appears periodically */}
      {randomEgg && (
        <div className="mb-4 p-4 bg-pink-100 rounded-lg border-2 border-pink-300 text-center">
          <h3 className="text-pink-800 font-bold mb-2" style={{ fontFamily: "'Eater', cursive" }}>
            Mysterious Egg Found!
          </h3>
          <div 
            className={`w-16 h-20 mx-auto bg-gradient-to-b ${getEggColor(randomEgg)} rounded-full border-2 ${getEggBorderColor(randomEgg)} flex items-center justify-center text-2xl`}
          >
            {getEggEmoji(randomEgg)}
          </div>
          <p className="mt-2 text-pink-700 text-sm">
            {randomEgg.charAt(0).toUpperCase() + randomEgg.slice(1)} Egg
          </p>
          <p className="text-xs text-orange-500">
            BTC Chance: {(1 - EGGS[randomEgg].emptyChance) * 100}%
          </p>
          <button
            onClick={() => handleOpenEgg(randomEgg)}
            className="mt-2 px-4 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-bold"
            style={{ fontFamily: "'Eater', cursive" }}
          >
            Open (Free)
          </button>
        </div>
      )}

      {/* Egg Shop */}
      <div className="mb-4 p-4 bg-pink-100 rounded-lg border-2 border-pink-300">
        <h3 className="text-pink-800 font-bold mb-2 text-center" style={{ fontFamily: "'Eater', cursive" }}>
          Egg Shop
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.values(EggType).map(eggType => (
            <div key={eggType} className="p-2 bg-pink-50 rounded-lg border border-pink-200 text-center">
              <div 
                className={`w-12 h-16 mx-auto bg-gradient-to-b ${getEggColor(eggType)} rounded-full border-2 ${getEggBorderColor(eggType)} flex items-center justify-center text-xl`}
              >
                {getEggEmoji(eggType)}
              </div>
              <p className="mt-1 text-pink-700 font-semibold text-sm">
                {eggType.charAt(0).toUpperCase() + eggType.slice(1)} Egg
              </p>
              <p className="text-xs text-orange-500">
                Cost: {formatBtc(EGGS[eggType].cost)} BTC
              </p>
              <p className="text-xs text-orange-500">
                BTC Reward: {formatBtc(EGGS[eggType].minReward)}-{formatBtc(EGGS[eggType].maxReward)}
              </p>
              <p className="text-xs text-green-600">
                Success Rate: {(1 - EGGS[eggType].emptyChance) * 100}%
              </p>
              <button
                onClick={() => handleOpenEgg(eggType)}
                disabled={btcBalance < EGGS[eggType].cost}
                className={`mt-2 px-3 py-1 ${
                  btcBalance >= EGGS[eggType].cost 
                    ? 'bg-pink-600 hover:bg-pink-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white rounded-lg text-xs font-bold`}
                style={{ fontFamily: "'Eater', cursive" }}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Result popup */}
      {openResult.visible && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-pink-100 rounded-lg border-2 border-pink-300 text-center z-50 shadow-lg min-w-40">
          {openResult.success ? (
            <>
              {openResult.isEmpty ? (
                <>
                  <h3 className="text-pink-800 font-bold" style={{ fontFamily: "'Eater', cursive" }}>
                    Empty Egg!
                  </h3>
                  <p className="text-pink-700 text-sm mt-1">Better luck next time!</p>
                </>
              ) : (
                <>
                  <h3 className="text-orange-500 font-bold" style={{ fontFamily: "'Eater', cursive" }}>
                    You found {formatBtc(openResult.btcReward || 0)} BTC!
                  </h3>
                  <p className="text-pink-700 text-sm mt-1">From {openResult.type} egg</p>
                </>
              )}
            </>
          ) : (
            <h3 className="text-pink-800 font-bold" style={{ fontFamily: "'Eater', cursive" }}>
              Not enough BTC!
            </h3>
          )}
        </div>
      )}

      {/* Next egg timer */}
      {!randomEgg && (
        <div className="text-xs text-pink-700 text-center mt-2">
          Next random egg in: {60 - eggTimer} seconds
        </div>
      )}
    </div>
  );
} 