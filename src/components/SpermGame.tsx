'use client';

import { useState, useEffect, useRef, TouchEvent, useCallback, useMemo } from 'react';
import React from 'react';
import Head from 'next/head';
import FarcasterAuth from './FarcasterAuth';
import { useFrameContext } from './providers/FrameProvider';
import sdk from '@farcaster/frame-sdk';

// Define game cell types
type Cell = 'empty' | 'sperm-head' | 'sperm-body' | 'food-good1' | 'food-good2' | 'food-good3' | 'food-good4' | 'food-bad1' | 'food-bad2' | 'food-bad3' | 'food-bad4' | 'egg-bronze' | 'egg-silver' | 'egg-gold' | 'egg-diamond';
type Direction = 'up' | 'down' | 'left' | 'right';
type GameState = 'menu' | 'playing' | 'gameover' | 'paused';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type FoodType = 'good1' | 'good2' | 'good3' | 'good4' | 'bad1' | 'bad2' | 'bad3' | 'bad4' | 'egg-bronze' | 'egg-silver' | 'egg-gold' | 'egg-diamond';
type CharacterType = 'naruto' | 'flash' | 'elon' | 'superman' | 'trump' | 'neo';

// Board size
const BOARD_SIZE = 15;

// Game speed settings for different difficulty levels
const GAME_SPEEDS = {
  easy: 200,    // ms
  medium: 150,  // ms
  hard: 100     // ms
} as const;

// Food values for scoring and health
const FOOD_VALUES = {
  good1: { points: 10, health: 10, coins: 0 },
  good2: { points: 20, health: 5, coins: 0 },
  good3: { points: 15, health: 15, coins: 0 },
  good4: { points: 30, health: 3, coins: 0 },
  bad1: { points: -5, health: -10, coins: 0 },
  bad2: { points: -10, health: -15, coins: 0 },
  bad3: { points: -15, health: -20, coins: 0 },
  bad4: { points: -25, health: -30, coins: 0 },
  'egg-bronze': { points: 15, health: 5, coins: 5 },
  'egg-silver': { points: 25, health: 10, coins: 15 },
  'egg-gold': { points: 40, health: 15, coins: 30 },
  'egg-diamond': { points: 60, health: 20, coins: 50 }
};

// Food item type definition
type FoodItem = {x: number, y: number, type: FoodType};

// Character definitions for easier expansion
interface Character {
  id: CharacterType;
  name: string;
  imagePrefix: string;
  frameCount: number;
  description?: string;
  color?: string;
  special?: string;
  unlocked?: boolean;
  price?: number;
}

const CHARACTERS: Character[] = [
  {
    id: 'naruto',
    name: 'Naruto',
    imagePrefix: 'sperm-head', // Using existing assets
    frameCount: 4,
    description: 'Fast and agile ninja sperm',
    color: 'orange',
    special: 'Shadow Clone',
    unlocked: false,
    price: 200
  },
  {
    id: 'flash',
    name: 'Flash',
    imagePrefix: 'flash-head',
    frameCount: 4,
    description: 'Fastest sperm alive',
    color: 'red',
    special: 'Speed Force',
    unlocked: false,
    price: 400
  },
  {
    id: 'elon',
    name: 'Elon',
    imagePrefix: 'elon-head',
    frameCount: 4,
    description: 'Tech genius sperm',
    color: 'blue',
    special: 'Rocket Boost',
    unlocked: false,
    price: 600
  },
  {
    id: 'superman',
    name: 'Superman',
    imagePrefix: 'superman-head',
    frameCount: 4,
    description: 'Man of Steel sperm',
    color: 'blue',
    special: 'Flight & Heat Vision',
    unlocked: false,
    price: 800
  },
  {
    id: 'trump',
    name: 'Trump',
    imagePrefix: 'trump-head',
    frameCount: 4,
    description: 'Business tycoon sperm',
    color: 'gold',
    special: 'Wall Builder',
    unlocked: false,
    price: 1000
  },
  {
    id: 'neo',
    name: 'Neo',
    imagePrefix: 'neo-head',
    frameCount: 4,
    description: 'The One sperm',
    color: 'black',
    special: 'Matrix Dodge',
    unlocked: true,
    price: 0
  }
];

// Game state constants
const GAME_STATE = {
  MENU: 'menu' as GameState,
  PLAYING: 'playing' as GameState,
  GAMEOVER: 'gameover' as GameState,
  PAUSED: 'paused' as GameState
};

// Always use medium difficulty
const FIXED_DIFFICULTY: keyof typeof GAME_SPEEDS = 'medium';

// Define Farcaster user type
interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfp?: string;
  wallet?: {
    address: string;
  };
}

export default function SpermGame() {
  const { context, openUrl, addFrame } = useFrameContext();
  const [board, setBoard] = useState<Cell[][]>(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill('empty')));
  const [sperm, setSperm] = useState<{x: number, y: number}[]>([
    {x: 7, y: 7}, // Head
    {x: 6, y: 7}, // Body
    {x: 5, y: 7}  // Tail
  ]);
  const [direction, setDirection] = useState<Direction>('right');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>(GAME_STATE.MENU);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('neo');
  const [unlockedCharacters, setUnlockedCharacters] = useState<Record<string, boolean>>({
    neo: true // Neo is always unlocked by default
  });
  const [currency, setCurrency] = useState<number>(0);
  const [showCharacterShop, setShowCharacterShop] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showGameInfo, setShowGameInfo] = useState<boolean>(false);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  const directionRef = useRef<Direction>('right');
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Sperm head size
  const FIXED_HEAD_SIZE = 150;
  
  // Game container ref
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Forward declare the handleGameOver function to break circular reference
  const handleGameOverRef = useRef<() => void>();
  
  // Food collection handler
  const handleFoodCollection = useCallback((foodType: FoodType, foodIndex: number) => {
    const { points, health: healthChange, coins = 0 } = FOOD_VALUES[foodType];
    
    // Add coins
    setCurrency(prev => prev + coins);
    
    // Add score
    setScore(prev => Math.max(0, prev + points));
    
    // Update health
    setHealth(prev => {
      const newHealth = Math.min(100, Math.max(0, prev + healthChange));
      if (newHealth <= 0 && handleGameOverRef.current) {
        handleGameOverRef.current();
      }
      return newHealth;
    });
    
    // Grow the sperm if food is good or it's an egg
    if (foodType.startsWith('good') || foodType.startsWith('egg')) {
      setSperm(prev => {
        const lastSegment = prev[prev.length - 1];
        return [...prev, { ...lastSegment }];
      });
    }
    
      // Show special effect for eggs
      if (foodType.startsWith('egg')) {
        // Special egg effect can be here
        const eggType = foodType.split('-')[1]; // bronze, silver, gold or diamond
        
        // Show a message on screen when collecting eggs
        setMessage(`${eggType.toUpperCase()}! +${coins} coins`);
        setTimeout(() => setMessage(''), 2000);
      }
    
    // Remove the food
    setFoodItems(prev => prev.filter((_, i) => i !== foodIndex));
    
    // Add new food
    const newFoodCount = Math.random() < 0.5 ? 1 : 2;
    setTimeout(() => generateMultipleFoodItems(newFoodCount, undefined), 0);
  }, []);
  
  // Generate multiple food items
  const generateMultipleFoodItems = useCallback((count: number, specificTypes?: FoodType[]) => {
    // Limit count to 1-2 objects as requested
    const actualCount = Math.min(count, specificTypes?.length || Math.floor(Math.random() * 2) + 1);
    const newFoodItems: FoodItem[] = [];
    
    for (let i = 0; i < actualCount; i++) {
      let randomType: FoodType;
      
      // Use specific food type if provided
      if (specificTypes && specificTypes[i]) {
        randomType = specificTypes[i];
      } else {
        // Normal food types
        const goodFoodTypes: FoodType[] = ['good1', 'good2', 'good3', 'good4'];
        const badFoodTypes: FoodType[] = ['bad1', 'bad2', 'bad3', 'bad4'];
        
        // Egg spawn probabilities
        const eggChances = {
                      'egg-bronze': 0.10,  // 10% chance - increased from 0.05
            'egg-silver': 0.025, // 2.5% chance
            'egg-gold': 0.01,    // 1% chance
            'egg-diamond': 0.005 // 0.5% chance
        };
        
        // Determine if an egg will appear
        const rng = Math.random();
        
        if (rng < eggChances['egg-bronze']) {
          randomType = 'egg-bronze';
        } else if (rng < eggChances['egg-bronze'] + eggChances['egg-silver']) {
          randomType = 'egg-silver';
        } else if (rng < eggChances['egg-bronze'] + eggChances['egg-silver'] + eggChances['egg-gold']) {
          randomType = 'egg-gold';
        } else if (rng < eggChances['egg-bronze'] + eggChances['egg-silver'] + eggChances['egg-gold'] + eggChances['egg-diamond']) {
          randomType = 'egg-diamond';
        } else {
          // Choose normal food type - 50% good, 50% bad
          const isBadFood = Math.random() < 0.5;
          if (isBadFood) {
            randomType = badFoodTypes[Math.floor(Math.random() * badFoodTypes.length)];
          } else {
            randomType = goodFoodTypes[Math.floor(Math.random() * goodFoodTypes.length)];
          }
        }
      }
      
      // Find a valid position on the board
      let x: number, y: number;
      let attempts = 0;
      const maxAttempts = 50;
      let validPosition = false;
      
      do {
        x = Math.floor(Math.random() * BOARD_SIZE);
        y = Math.floor(Math.random() * BOARD_SIZE);
        attempts++;
        
        const isOccupiedBySperm = sperm.some(segment => segment.x === x && segment.y === y);
        const isOccupiedByFood = foodItems.some(food => food.x === x && food.y === y) || 
                                newFoodItems.some(food => food.x === x && food.y === y);
        
        validPosition = !isOccupiedBySperm && !isOccupiedByFood;
        
        if (attempts > maxAttempts) {
          if (newFoodItems.length === 0 && i === 0) {
            // Exhaustive search for a free cell
            for (let checkY = 0; checkY < BOARD_SIZE; checkY++) {
              for (let checkX = 0; checkX < BOARD_SIZE; checkX++) {
                const isOccupiedBySperm = sperm.some(segment => segment.x === checkX && segment.y === checkY);
                const isOccupiedByFood = foodItems.some(food => food.x === checkX && food.y === checkY) || 
                                        newFoodItems.some(food => food.x === checkX && food.y === checkY);
                
                if (!isOccupiedBySperm && !isOccupiedByFood) {
                  x = checkX;
                  y = checkY;
                  validPosition = true;
                  break;
                }
              }
              if (validPosition) break;
            }
          }
          break;
        }
      } while (!validPosition);
      
      if (validPosition) {
        newFoodItems.push({ x, y, type: randomType });
      }
    }
    
    setFoodItems(prev => [...prev, ...newFoodItems]);
  }, [sperm, foodItems]);
  
  // Start animation timer
  const startAnimationTimer = () => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }
    
    animationTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      setFrameIndex(prev => (prev + 1) % 4);
    }, 200);
  };

  // Initialize game
  useEffect(() => {
    isMountedRef.current = true;
    
    try {
      const savedHighScore = localStorage.getItem('spermSurvivalHighScore');
      if (savedHighScore) {
        setHighScore(Number(savedHighScore));
      }
    } catch (e) {
      // Ignore error
    }
    
    startAnimationTimer();
    
    return () => {
      isMountedRef.current = false;
      
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);
  
  // Update board based on sperm position and food items
  const updateBoard = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const newBoard = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill('empty'));
    
    for (let i = 0; i < sperm.length; i++) {
      const segment = sperm[i];
      if (segment.y >= 0 && segment.y < BOARD_SIZE && segment.x >= 0 && segment.x < BOARD_SIZE) {
        // Only mark body segments, head will be rendered separately
        if (i !== 0) {
          newBoard[segment.y][segment.x] = 'sperm-body';
        }
      }
    }
    
    for (const food of foodItems) {
      if (food.y >= 0 && food.y < BOARD_SIZE && food.x >= 0 && food.x < BOARD_SIZE) {
        newBoard[food.y][food.x] = `food-${food.type}` as Cell;
      }
    }
    
    setBoard(newBoard);
  }, [sperm, foodItems]);
  
  // Update board when sperm or food changes
  useEffect(() => {
    if (sperm.length > 0) {
      updateBoard();
    }
  }, [sperm, foodItems, updateBoard]);
  
      // Generate food when game starts or food is consumed
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && foodItems.length === 0) {
      generateMultipleFoodItems(3, undefined);
    }
  }, [gameState, foodItems, generateMultipleFoodItems]);
  
  // Focus on container
  useEffect(() => {
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, [gameState]);

      // Timer to spawn food items
  useEffect(() => {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    const spawnFoodInterval = setInterval(() => {
      generateMultipleFoodItems(3, undefined);
    }, 15000);
    
    return () => clearInterval(spawnFoodInterval);
  }, [gameState, generateMultipleFoodItems]);
    
  // Collision detection
  useEffect(() => {
    if (gameState !== GAME_STATE.PLAYING || foodItems.length === 0) return;
    
    const collisionInterval = setInterval(() => {
      if (sperm.length === 0) return;
      
      const head = sperm[0];
      
      for (let i = 0; i < foodItems.length; i++) {
        const food = foodItems[i];
        
        if (head.x === food.x && head.y === food.y) {
          handleFoodCollection(food.type, i);
          break;
        }
      }
    }, 50);
    
    return () => clearInterval(collisionInterval);
  }, [sperm, foodItems, gameState, handleFoodCollection]);
  
  // Start game
  const startGame = () => {
    setGameState(GAME_STATE.PLAYING);
    setHealth(100);
    setFoodItems([]);
    initGame();
    
    setTimeout(() => generateMultipleFoodItems(2, undefined), 0);
  };
  
  // Initialize game
  const initGame = () => {
    setGameOver(false);
    setScore(0);
    setFrameIndex(0);
    
    const initialSperm = [
      {x: 7, y: 7},
      {x: 6, y: 7},
      {x: 5, y: 7}
    ];
    setSperm(initialSperm);
    setDirection('right');
    directionRef.current = 'right';
    
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    gameLoopRef.current = setInterval(gameLoop, GAME_SPEEDS[FIXED_DIFFICULTY]);
  };
  
  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (gameState !== GAME_STATE.PLAYING && gameState !== GAME_STATE.PAUSED) return;
    
    e.preventDefault();
    
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      togglePause();
      return;
    }
    
    if (gameState === GAME_STATE.PAUSED) return;
    
    const now = Date.now();
    if (now - lastKeyTimeRef.current < 80) return;
    lastKeyTimeRef.current = now;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (directionRef.current !== 'down') {
          directionRef.current = 'up';
          setDirection('up');
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (directionRef.current !== 'up') {
          directionRef.current = 'down';
          setDirection('down');
        }
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (directionRef.current !== 'right') {
          directionRef.current = 'left';
          setDirection('left');
        }
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (directionRef.current !== 'left') {
          directionRef.current = 'right';
          setDirection('right');
        }
        break;
      case ' ':
        if (gameState === GAME_STATE.GAMEOVER) {
          startGame();
        }
        break;
    }
  };
  
  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // Skip if the touch target is a button
    if ((e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  
  // Handle touch end
  const handleTouchEnd = (e: TouchEvent) => {
    if (gameState !== GAME_STATE.PLAYING || !touchStartRef.current) return;
    
    // Skip if the touch target is a button
    if ((e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    // Increase the threshold for better mobile response
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) return;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0 && directionRef.current !== 'left') {
        directionRef.current = 'right';
        setDirection('right');
      } else if (diffX < 0 && directionRef.current !== 'right') {
        directionRef.current = 'left';
        setDirection('left');
      }
    } else {
      if (diffY > 0 && directionRef.current !== 'up') {
        directionRef.current = 'down';
        setDirection('down');
      } else if (diffY < 0 && directionRef.current !== 'down') {
        directionRef.current = 'up';
        setDirection('up');
      }
    }
    
    touchStartRef.current = null;
  };
  
  // Handle button click for direction changes
  const handleButtonClick = (newDirection: Direction) => {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    if (
      (directionRef.current === 'up' && newDirection === 'down') ||
      (directionRef.current === 'down' && newDirection === 'up') ||
      (directionRef.current === 'left' && newDirection === 'right') ||
      (directionRef.current === 'right' && newDirection === 'left')
    ) {
      return;
    }
    
    directionRef.current = newDirection;
    setDirection(newDirection);
  };
  
  // Game loop
  const gameLoop = () => {
    moveSperm();
  };
  
  // Setup fallback food styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .food-good1-fallback { background-color: #4ade80; }
      .food-good2-fallback { background-color: #16a34a; }
      .food-good3-fallback { background-color: #60a5fa; }
      .food-good4-fallback { background-color: #2563eb; }
      .food-bad1-fallback { background-color: #f87171; }
      .food-bad2-fallback { background-color: #dc2626; }
      .food-bad3-fallback { background-color: #c084fc; }
      .food-bad4-fallback { background-color: #7e22ce; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Update board frequently during gameplay
  useEffect(() => {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    const boardUpdateInterval = setInterval(() => {
      updateBoard();
    }, 50); // Decreased from 100ms to 50ms for more frequent updates
    
    return () => clearInterval(boardUpdateInterval);
  }, [gameState, updateBoard]);
    
      // Move sperm
    const moveSperm = () => {
    setSperm(prevSperm => {
      const head = {...prevSperm[0]};
      
      switch (directionRef.current) {
        case 'up': head.y -= 1; break;
        case 'down': head.y += 1; break;
        case 'left': head.x -= 1; break;
        case 'right': head.x += 1; break;
      }
      
      // Handle screen edge wrapping
      if (head.y < 0) head.y = BOARD_SIZE - 1;
      else if (head.y >= BOARD_SIZE) head.y = 0;
      if (head.x < 0) head.x = BOARD_SIZE - 1;
      else if (head.x >= BOARD_SIZE) head.x = 0;
      
      // Check for collision with self, but skip checking the next segment
      // This prevents false collisions at the neck
      for (let i = 1; i < prevSperm.length - 1; i++) {
        if (prevSperm[i].x === head.x && prevSperm[i].y === head.y) {
          // Reduce health on self-collision but allow sperm to pass through itself
          setHealth(prev => {
            const newHealth = Math.max(0, prev - 1);
            if (newHealth <= 0 && handleGameOverRef.current) {
              handleGameOverRef.current();
              return 0;
            }
            return newHealth;
          });
          
          return [head, ...prevSperm.slice(0, -1)];
        }
      }
      
      return [head, ...prevSperm.slice(0, -1)];
    });
  };
  
  // Handle game over
  const handleGameOver = () => {
    setGameOver(true);
    setGameState(GAME_STATE.GAMEOVER);
    
    // Add currency reward based on score
    const reward = Math.floor(score / 10);
    if (reward > 0) {
      setCurrency(prev => prev + reward);
    }
    
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('spermSurvivalHighScore', score.toString());
      } catch (e) {
        // Ignore error
      }
    }
  };
  
  // Assign handleGameOver to the ref after its definition
  useEffect(() => {
    handleGameOverRef.current = handleGameOver;
  }, []);
  
  // Restart game
  const restartGame = () => {
    startGame();
  };
  
  // Return to menu
  const returnToMenu = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    setGameState(GAME_STATE.MENU);
    setScore(0);
    setHealth(100);
  };
  
  // Toggle pause state
  const togglePause = () => {
    if (gameState === GAME_STATE.PLAYING) {
      setGameState(GAME_STATE.PAUSED);
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    } else if (gameState === GAME_STATE.PAUSED) {
      setGameState(GAME_STATE.PLAYING);
      if (gameLoopRef.current === null) {
        gameLoopRef.current = setInterval(gameLoop, GAME_SPEEDS[FIXED_DIFFICULTY]);
      }
    }
  };
  
  // Render food items
  const renderFoodItem = (cellType: string) => {
    // Check if it's an egg type
    if (cellType.startsWith('egg-')) {
      const eggType = cellType.replace('egg-', '');
      
      return (
        <div 
          className="absolute inset-0 flex items-center justify-center" 
          style={{ 
            zIndex: 30,
            width: '100%', 
            height: '100%',
            transform: 'scale(1.3)',
            animation: 'pulse 1.5s infinite'
          }}
        >
          <div className={`w-8 h-8 rounded-full bg-gradient-to-b ${getEggColor(eggType)} border-2 ${getEggBorderColor(eggType)} flex items-center justify-center text-base`}>
            {getEggEmoji(eggType)}
          </div>
        </div>
      );
    }
    // Normal food type
    else if (cellType.startsWith('food-')) {
      const foodType = cellType.replace('food-', '');
      
      return (
        <div 
          className="absolute inset-0 flex items-center justify-center" 
          style={{ 
            zIndex: 30,
            width: '100%', 
            height: '100%',
            transform: 'scale(1.2)',
          }}
        >
          <img 
            src={`/game-assets/${foodType}.png`}
            alt={`Food ${foodType}`}
            className={`w-full h-full object-contain ${foodType}-food`}
            style={{ 
              display: 'block',
              width: '24px',
              height: '24px',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              
              if (target.parentElement) {
                target.parentElement.className = `absolute inset-0 rounded-full ${foodType}-fallback`;
              }
            }}
          />
          
          <div 
            className={`hidden w-full h-full rounded-full ${foodType}-fallback`}
            style={{ 
              width: '24px', 
              height: '24px'
            }}
          ></div>
        </div>
      );
    }
    return null;
  };
  
      // Egg colors
  const getEggColor = (eggType: string): string => {
    switch (eggType) {
      case 'bronze': return 'from-yellow-700 to-yellow-800';
      case 'silver': return 'from-gray-300 to-gray-400';
      case 'gold': return 'from-yellow-300 to-yellow-500';
      case 'diamond': return 'from-blue-300 to-blue-500';
      default: return 'from-gray-300 to-gray-400';
    }
  };
  
  // Egg border colors
  const getEggBorderColor = (eggType: string): string => {
    switch (eggType) {
      case 'bronze': return 'border-yellow-600';
      case 'silver': return 'border-gray-500';
      case 'gold': return 'border-yellow-400';
      case 'diamond': return 'border-blue-400';
      default: return 'border-gray-400';
    }
  };
  
  // Egg emojis
  const getEggEmoji = (eggType: string): string => {
    switch (eggType) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'diamond': return '💎';
      default: return '🥚';
    }
  };
  
  // Get character image based on selection and animation frame
  const getCharacterImage = (frameIdx: number) => {
    const character = CHARACTERS.find(c => c.id === selectedCharacter) || CHARACTERS.find(c => c.id === 'neo');
    const frameNumber = ((frameIdx % 4) + 1);
    const imagePath = `/game-assets/${character?.imagePrefix}-${frameNumber}.png`;
    
    // Cache images for better performance
    if (!imagePath.includes('undefined')) {
      return imagePath;
    }
    
    // Fallback to neo if something went wrong
    return `/game-assets/neo-head-${frameNumber}.png`;
  };
  
  // Save character preference
  const selectCharacter = (charId: CharacterType) => {
    // Only select if the character is unlocked
    if (unlockedCharacters[charId]) {
      setSelectedCharacter(charId);
      try {
        localStorage.setItem('spermSurvivalCharacter', charId);
      } catch (e) {
        // Ignore error
      }
    }
  };
  
  // Load saved character preference
  useEffect(() => {
    try {
      const savedCharacter = localStorage.getItem('spermSurvivalCharacter') as CharacterType;
      if (savedCharacter && CHARACTERS.some(c => c.id === savedCharacter) && unlockedCharacters[savedCharacter]) {
        setSelectedCharacter(savedCharacter);
      } else {
        // Default to Neo if saved character is not unlocked
        setSelectedCharacter('neo');
      }
    } catch (e) {
      // Ignore error
    }
  }, [unlockedCharacters]);
  
  // Load saved currency, BTC, and unlocked characters
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
  
  // Save currency and BTC when they change
  useEffect(() => {
    try {
      localStorage.setItem('spermGameCurrency', currency.toString());
    } catch (e) {
      // Ignore errors
    }
  }, [currency]);
  
  // Handle character unlocking
  const handleUnlockCharacter = (characterId: string, price: number): boolean => {
    // Check if already unlocked
    if (unlockedCharacters[characterId]) {
      return true;
    }
    
    // Try to purchase
    if (currency >= price) {
      setCurrency(prev => prev - price);
      setUnlockedCharacters(prev => {
        const newUnlocked = {
          ...prev,
          [characterId]: true
        };
        
        // Save to localStorage
        try {
          localStorage.setItem('spermGameUnlockedChars', JSON.stringify(newUnlocked));
        } catch (e) {
          // Ignore error
        }
        
        return newUnlocked;
      });
      return true;
    }
    
    return false;
  };
  
  // Check if a character is unlocked
  const isCharacterUnlocked = (characterId: string): boolean => {
    return !!unlockedCharacters[characterId];
  };
  
  // Handle egg opening
  const handleOpenEgg = (eggType: string): { success: boolean; reward?: number; isEmpty?: boolean } => {
    // Implementation will be provided by the EggSystem component
    return { success: false };
  };
  
  // Handle Farcaster sign-in
  const handleFarcasterSignIn = (user: FarcasterUser) => {
    setUser(user);
    // If we don't already have a farcaster user from the context, use this one
    if (!farcasterUser) {
      setFarcasterUser(user);
    }
  };
  
  // Import currency system, egg system components
  const currencySystem = useMemo(() => {
    return {
      currency,
      addCurrency: (amount: number) => setCurrency(prev => prev + amount),
      deductCurrency: (amount: number) => {
        if (currency >= amount) {
          setCurrency(prev => prev - amount);
          return true;
        }
        return false;
      },
      openEgg: handleOpenEgg,
      unlockCharacter: handleUnlockCharacter,
      isCharacterUnlocked,
      generateRandomEgg: () => null // Will be implemented by EggSystem
    };
  }, [currency, unlockedCharacters]);
  
  // Timer to spawn eggs with low probability every 10 seconds
  useEffect(() => {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    const eggSpawnInterval = setInterval(() => {
      // Very low probability to spawn an egg (5% chance every 10 seconds)
      if (Math.random() < 0.05) {
        const eggTypes: FoodType[] = ['egg-bronze', 'egg-silver', 'egg-gold', 'egg-diamond'];
        const probabilities = [0.7, 0.2, 0.08, 0.02]; // Higher chance for bronze
        
        let selectedEgg: FoodType | null = null;
        const rand = Math.random();
        let cumProb = 0;
        
        for (let i = 0; i < eggTypes.length; i++) {
          cumProb += probabilities[i];
          if (rand <= cumProb) {
            selectedEgg = eggTypes[i];
            break;
          }
        }
        
        if (selectedEgg) {
          // Generate a single egg using the existing function
          generateMultipleFoodItems(1, [selectedEgg]);
          
          // Show a special message for rare eggs
          if (selectedEgg !== 'egg-bronze') {
            setMessage(`Rare ${selectedEgg.replace('egg-', '')} spotted!`);
            setTimeout(() => setMessage(''), 2000);
          }
        }
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(eggSpawnInterval);
  }, [gameState, generateMultipleFoodItems]);
  
  // Update board when frame index changes
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING) {
      updateBoard();
    }
  }, [frameIndex, gameState, updateBoard]);
  
  // Handle cast game score
  const handleCastScore = useCallback(async () => {
    try {
      if (context) {
        const message = `🧠 I just scored ${score} points in Sperm Survival! Come play and beat me: https://spermfarcaster.vercel.app`;
        const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`;
        
        // Use the openUrl function from context
        await openUrl(url);
      } else {
        // Fallback for non-Farcaster contexts
        alert('Score sharing is only available in Farcaster.');
      }
    } catch (error) {
      console.error('Error sharing score:', error);
      setMessage('Failed to share score');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [score, context, openUrl]);

  // Check for Mini App context user
  useEffect(() => {
    if (context?.user) {
      setFarcasterUser({
        fid: context.user.fid,
        username: context.user.username || `user${context.user.fid}`,
        displayName: context.user.displayName,
        pfp: context.user.pfpUrl
      });
    }
  }, [context]);
  
  // Handle adding app to Farcaster
  const handleAddToFarcaster = useCallback(async () => {
    try {
      await addFrame();
      setMessage('Frame Added!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding app to Farcaster:', error);
      setMessage('Failed to add frame');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [addFrame]);
  
  // Handle connect wallet
  const handleConnectWallet = useCallback(async () => {
    try {
      // First check if we're in Farcaster context and can use their wallet
      if (context) {
        try {
          // Check if Farcaster wallet is available
          if (sdk.wallet && sdk.wallet.ethProvider) {
            const accounts = await sdk.wallet.ethProvider.request({ 
              method: 'eth_requestAccounts' 
            });
            
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              setIsWalletConnected(true);
              setMessage('Wallet connected via Farcaster!');
              setTimeout(() => setMessage(''), 3000);
              return;
            }
          }
        } catch (error) {
          console.error('Error connecting via Farcaster wallet:', error);
        }
      }

      // Fall back to regular Web3 wallet (MetaMask, etc.)
      const ethereum = window.ethereum as any;
      if (ethereum) {
        try {
          const accounts = await ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          // Check if we need to switch to Monad testnet
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x278f' }], // Monad testnet chainId: 10143 (0x278f in hex)
            });
          } catch (switchError) {
            // If the chain doesn't exist, add it
            if ((switchError as any).code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x278f', // 10143 in hex
                  chainName: 'Monad Testnet',
                  nativeCurrency: {
                    name: 'MONAD',
                    symbol: 'MON',
                    decimals: 18
                  },
                  rpcUrls: ['https://testnet-rpc.monad.xyz/'],
                  blockExplorerUrls: ['https://testnet.monadexplorer.com/']
                }],
              });
            } else {
              throw switchError;
            }
          }
          
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
            setMessage('Wallet connected!');
            setTimeout(() => setMessage(''), 3000);
          }
        } catch (error) {
          console.error('Error connecting wallet:', error);
          setMessage('Failed to connect wallet');
          setTimeout(() => setMessage(''), 3000);
        }
      } else {
        setMessage('No Ethereum wallet found. Please install MetaMask.');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error in wallet connection flow:', error);
      setMessage('Wallet connection failed');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [context]);

  // Listen for account changes
  useEffect(() => {
    const ethereum = window.ethereum as any;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setIsWalletConnected(false);
          setWalletAddress('');
        } else {
          // User switched accounts
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Check wallet connection on load
  useEffect(() => {
    const checkWalletConnection = async () => {
      // Try Farcaster wallet first
      if (context && sdk.wallet && sdk.wallet.ethProvider) {
        try {
          const accounts = await sdk.wallet.ethProvider.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
            return;
          }
        } catch (error) {
          console.error('Error checking Farcaster wallet:', error);
        }
      }
      
      // Fall back to regular wallet
      const ethereum = window.ethereum as any;
      if (ethereum) {
        try {
          const accounts = await ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    checkWalletConnection();
  }, [context]);
  
  return (
          <div 
      className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-pink-400 to-pink-500 p-0 text-white game-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ 
        outline: 'none', 
        paddingTop: '5px', 
        maxWidth: '100%', 
        paddingLeft: '0', 
        paddingRight: '0',
        overflowX: 'hidden'
      }}
      ref={gameContainerRef}
    >
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Creepster&family=Eater&display=swap" rel="stylesheet" />
      </Head>
      
      {/* Only show the main menu if wallet is connected, otherwise show Farcaster login screen */}
      {gameState === GAME_STATE.MENU && (
        <>
          {isConnected ? (
            // Show main menu if wallet is connected
            <div className="relative bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl shadow-2xl overflow-hidden w-[320px] max-w-[90%]">
              {/* Logo background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-pink-200 to-transparent opacity-20"></div>
              
              {/* Main logo with SURVIVAL text */}
              <div className="pt-6 pb-2 flex flex-col items-center justify-center relative z-10">
                <img 
                  src="/game-assets/logo.png" 
                  alt="SPERM Logo" 
                  className="w-60 h-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/og-image.png';
                  }}
                />
              </div>
              
              {/* Menu content */}
              <div className="px-4 pb-6 relative z-10">
                {/* User Info with Profile Picture */}
                {user && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center bg-white bg-opacity-30 rounded-full pr-3 pl-1 py-1">
                      {user.pfp ? (
                        <img 
                          src={user.pfp} 
                          alt={user.displayName || user.username} 
                          className="w-10 h-10 rounded-full mr-2 border-2 border-white"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center mr-2 border-2 border-white">
                          <span className="text-white font-bold">{(user.displayName || user.username || '?').charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="font-bold text-white">{user.displayName || user.username}</span>
                    </div>
                  </div>
                )}

                {/* Display wallet address if connected */}
                {isWalletConnected && walletAddress && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                      <p className="text-xs text-white">
                        {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Game stats */}
                <div className="flex items-center mb-6 bg-white bg-opacity-20 rounded-xl p-2 shadow-md backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-1 w-full">
                    <div className="text-center bg-white bg-opacity-20 rounded-lg p-2">
                      <p className="text-xs text-pink-100 uppercase tracking-wider">HIGH SCORE</p>
                      <p className="text-2xl font-bold text-white">{highScore}</p>
                    </div>
                    <div className="text-center bg-white bg-opacity-20 rounded-lg p-2">
                      <p className="text-xs text-pink-100 uppercase tracking-wider">COINS</p>
                      <p className="text-2xl font-bold text-white flex items-center justify-center">
                        <img src="/game-assets/coin.png" alt="Coin" className="w-7 h-7 mr-1" onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextSibling!.textContent = '🪙';
                        }} />
                        <span className="mr-1" style={{display: 'none'}}>🪙</span>{currency}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Selected character display - increased size by 15% */}
                <div className="mb-5 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white bg-opacity-30 rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <img 
                      src={`/game-assets/${CHARACTERS.find(c => c.id === selectedCharacter)?.imagePrefix || 'neo-head'}-1.png`}
                      alt="Selected Character" 
                      className="w-16 h-16 object-contain" 
                      style={{ 
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/og-image.png';
                      }}
                    />
                  </div>
                  <p className="text-base font-bold text-white">
                    {CHARACTERS.find(c => c.id === selectedCharacter)?.name || 'Neo'}
                  </p>
                </div>
                
                {/* Menu buttons */}
                <div className="flex flex-col gap-3">
                  {isWalletConnected ? (
                    <button 
                      className="w-full py-4 px-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-xl text-white font-bold text-lg transform transition-all hover:scale-105 active:scale-95 shadow-lg"
                      onClick={startGame}
                      style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1.1rem, 5vw, 1.4rem)' }}
                    >
                      START GAME
                    </button>
                  ) : (
                    <button 
                      className="w-full py-4 px-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-xl text-white font-bold text-lg transform transition-all hover:scale-105 active:scale-95 shadow-lg"
                      onClick={handleConnectWallet}
                      style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1.1rem, 5vw, 1.4rem)' }}
                    >
                      CONNECT WALLET
                    </button>
                  )}
                  
                  <button 
                    className="w-full py-3 px-8 bg-gradient-to-r from-pink-300 to-pink-500 rounded-xl text-white font-bold transform transition-all hover:scale-105 active:scale-95 shadow-lg"
                    onClick={() => setShowCharacterShop(true)}
                    style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1rem, 5vw, 1.2rem)' }}
                  >
                    CHARACTER SHOP
                  </button>
                  
                  <button 
                    className="w-full py-3 px-8 bg-gradient-to-r from-pink-300 to-pink-500 rounded-xl text-white font-bold transform transition-all hover:scale-105 active:scale-95 shadow-lg"
                    onClick={() => setShowGameInfo(true)}
                    style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1rem, 5vw, 1.2rem)' }}
                  >
                    GAME INFO
                  </button>
                  
                  {context !== undefined && (
                    <button 
                      className="w-full py-3 px-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl text-white font-bold transform transition-all hover:scale-105 active:scale-95 shadow-lg"
                      onClick={handleAddToFarcaster}
                      style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1rem, 5vw, 1.2rem)' }}
                    >
                      ADD FRAME
                    </button>
                  )}
                </div>
                
                {/* Version info */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-pink-100 opacity-70">Build by Cassini</p>
                </div>
              </div>
            </div>
          ) : (
            // Show login screen if wallet is not connected
            <div className="relative bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl shadow-2xl overflow-hidden w-[320px] max-w-[90%]">
              {/* Logo background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-pink-200 to-transparent opacity-20"></div>
              
              {/* Main logo with SURVIVAL text */}
              <div className="pt-6 pb-2 flex flex-col items-center justify-center relative z-10">
                <img 
                  src="/game-assets/logo.png" 
                  alt="SPERM Logo" 
                  className="w-60 h-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/og-image.png';
                  }}
                />
              </div>
              
              {/* Connect wallet content */}
              <div className="px-4 pb-6 relative z-10">
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Creepster', cursive" }}>Welcome to the Game</h2>
                  <p className="text-pink-100">Connect your wallet to play and earn coins!</p>
                </div>
                
                {/* Direct wallet connection */}
                <div className="mb-6">
                  <FarcasterAuth onSignIn={handleFarcasterSignIn} />
                </div>
                
                {/* Version info */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-pink-100 opacity-70">Version 2.0</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
                  {/* Character Shop Modal */}
      {showCharacterShop && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'Creepster', cursive" }}>
                CHARACTER SHOP
              </h3>
              <button 
                onClick={() => setShowCharacterShop(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all"
              >
                ✕
              </button>
            </div>
            
            {/* Coins display with emoji */}
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3 mb-6">
              <p className="text-center text-white">
                <span className="text-pink-100 text-sm uppercase tracking-wider">Available Coins</span>
                <span className="block text-2xl font-bold flex items-center justify-center">
                  <img src="/game-assets/coin.png" alt="Coin" className="w-10 h-10 mr-2" onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextSibling!.textContent = '🪙';
                  }} />
                  <span className="mr-2" style={{display: 'none'}}>🪙</span>{currency}
                </span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {CHARACTERS.map(character => (
                <div 
                  key={character.id}
                  className={`rounded-xl overflow-hidden ${
                    unlockedCharacters[character.id] 
                    ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg' 
                    : 'bg-white bg-opacity-20 backdrop-blur-sm'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-center mb-3 h-16 relative">
                      <div className={`absolute inset-0 rounded-full ${unlockedCharacters[character.id] ? 'bg-green-300' : 'bg-white'} bg-opacity-30 m-auto w-16 h-16`}></div>
                    <img 
                      src={`/game-assets/${character.imagePrefix}-1.png`}
                      alt={character.name} 
                        className="w-14 h-14 object-contain relative z-10" // Increased from 12x12 to 14x14
                        style={{ 
                          imageRendering: 'pixelated',
                          filter: 'contrast(1.15) drop-shadow(0 0 2px rgba(0,0,0,0.4))'
                        }}
                    />
                  </div>
                    
                    <p className="text-base font-bold text-center text-white mb-1">{character.name}</p>
                    
                    {!unlockedCharacters[character.id] ? (
                      <>
                        <p className="text-xs text-center text-pink-100 mb-2 flex items-center justify-center">
                          <img src="/game-assets/coin.png" alt="Coin" className="w-4 h-4 mr-1" onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextSibling!.textContent = '🪙';
                          }} />
                          <span className="mr-1" style={{display: 'none'}}>🪙</span>{character.price}
                        </p>
                        <button
                          onClick={() => handleUnlockCharacter(character.id, character.price || 0)}
                          disabled={currency < (character.price || 0)}
                          className={`w-full px-2 py-2 text-xs text-white rounded-lg font-bold ${
                            currency >= (character.price || 0) 
                            ? 'bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 transform transition-transform hover:scale-105 active:scale-95' 
                            : 'bg-gray-500 bg-opacity-50 cursor-not-allowed'
                          }`}
                          style={{ fontFamily: "Arial, sans-serif" }}
                        >
                          UNLOCK
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="bg-green-300 bg-opacity-30 px-3 py-1 rounded-full">
                          <p className="text-xs text-center text-white font-semibold">UNLOCKED</p>
                        </div>
                    </div>
                    )}
                  </div>
                  {selectedCharacter === character.id && unlockedCharacters[character.id] && (
                    <div className="bg-white bg-opacity-25 py-1">
                      <p className="text-xs text-center text-white font-bold" style={{ fontFamily: "Arial, sans-serif" }}>SELECTED</p>
                    </div>
                  )}
                  {unlockedCharacters[character.id] && selectedCharacter !== character.id && (
                    <button
                      onClick={() => selectCharacter(character.id)}
                      className="w-full py-1 bg-purple-500 bg-opacity-40 hover:bg-opacity-60 text-white text-xs font-bold"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      SELECT
                    </button>
                  )}
                </div>
              ))}
            </div>
            
                          <button
                onClick={() => setShowCharacterShop(false)}
                className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-pink-600 text-white rounded-xl font-bold transform transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                BACK TO MENU
              </button>
          </div>
        </div>
      )}
      
      {/* Game Info Modal */}
      {showGameInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'Creepster', cursive" }}>
                GAME INFO
              </h3>
              <button 
                onClick={() => setShowGameInfo(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all"
              >
                ✕
              </button>
            </div>
            
                         <div className="text-white">
               <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
                 <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Creepster', cursive" }}>Game Basics</h4>
                 <div className="flex items-center mb-3 bg-black bg-opacity-20 p-2 rounded-lg">
                   <img 
                     src="/game-assets/sperm-head-1.png" 
                     alt="Player" 
                     className="w-12 h-12 mr-3"
                     style={{ imageRendering: 'pixelated' }}
                   />
                   <p>Navigate your sperm through the arena to collect eggs, gain points, and survive as long as possible.</p>
                 </div>
                 <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
                   <div className="bg-black bg-opacity-20 p-2 rounded-lg text-center">
                     <div className="flex justify-center mb-1">
                       <img src="/game-assets/keyboard.png" alt="Keyboard" className="h-8" onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                       }} />
                     </div>
                     <p className="text-sm">Arrow keys or WASD</p>
                   </div>
                   <div className="bg-black bg-opacity-20 p-2 rounded-lg text-center">
                     <div className="flex justify-center mb-1">
                       <img src="/game-assets/swipe.png" alt="Mobile" className="h-8" onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                         (e.target as HTMLImageElement).nextElementSibling!.textContent = "👆";
                       }} />
                       <span style={{display: 'none', fontSize: '24px'}}>👆</span>
                     </div>
                     <p className="text-sm">Swipe to move</p>
                   </div>
                   <div className="bg-black bg-opacity-20 p-2 rounded-lg text-center">
                     <div className="flex justify-center mb-1">
                       <img src="/game-assets/pause.png" alt="Pause" className="h-8" onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                         (e.target as HTMLImageElement).nextElementSibling!.textContent = "⏸️";
                       }} />
                       <span style={{display: 'none', fontSize: '24px'}}>⏸️</span>
                     </div>
                     <p className="text-sm">ESC or P to pause</p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
                 <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Creepster', cursive" }}>Egg System</h4>
                 <div className="mb-3 px-3 py-2 bg-purple-600 bg-opacity-40 rounded-lg text-center">
                   <p className="font-bold" style={{ fontFamily: "Arial, sans-serif" }}>Only eggs give you coins! Collect them to unlock characters</p>
                 </div>

                 <div className="grid grid-cols-2 gap-3 mb-2">
                   <div className="flex items-center bg-black bg-opacity-20 p-2 rounded-lg">
                     <div className="w-10 h-10 mr-2 rounded-full bg-gradient-to-b from-yellow-700 to-yellow-800 border-2 border-yellow-600 flex items-center justify-center">
                       <span>🥉</span>
                     </div>
                     <div>
                       <p className="font-bold text-sm">Bronze Egg</p>
                       <p className="text-xs">Common (10%) - 5 coins</p>
                     </div>
                   </div>
                   <div className="flex items-center bg-black bg-opacity-20 p-2 rounded-lg">
                     <div className="w-10 h-10 mr-2 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 border-2 border-gray-500 flex items-center justify-center">
                       <span>🥈</span>
                     </div>
                     <div>
                       <p className="font-bold text-sm">Silver Egg</p>
                       <p className="text-xs">Uncommon (2.5%) - 15 coins</p>
                     </div>
                   </div>
                   <div className="flex items-center bg-black bg-opacity-20 p-2 rounded-lg">
                     <div className="w-10 h-10 mr-2 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 border-2 border-yellow-400 flex items-center justify-center">
                       <span>🥇</span>
                     </div>
                     <div>
                       <p className="font-bold text-sm">Gold Egg</p>
                       <p className="text-xs">Rare (1%) - 30 coins</p>
                     </div>
                   </div>
                   <div className="flex items-center bg-black bg-opacity-20 p-2 rounded-lg">
                     <div className="w-10 h-10 mr-2 rounded-full bg-gradient-to-b from-blue-300 to-blue-500 border-2 border-blue-400 flex items-center justify-center">
                       <span>💎</span>
                     </div>
                     <div>
                       <p className="font-bold text-sm">Diamond Egg</p>
                       <p className="text-xs">Very Rare (0.5%) - 50 coins</p>
                     </div>
                   </div>
                 </div>
                 <div className="text-center text-sm italic bg-black bg-opacity-20 p-2 rounded-lg">
                   <p>Special rare eggs have a 5% chance to appear every 10 seconds!</p>
                 </div>
               </div>
               
               <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
                 <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Creepster', cursive" }}>Food Types</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-green-900 bg-opacity-30 rounded-lg p-3">
                     <div className="flex items-center mb-2">
                       <div className="flex gap-1 mr-2">
                         <img src="/game-assets/good1.png" alt="Good Food" className="w-8 h-8" onError={(e) => {
                           (e.target as HTMLImageElement).style.display = 'none';
                           (e.target as HTMLImageElement).nextElementSibling!.textContent = "🍎";
                         }} />
                         <span style={{display: 'none', fontSize: '24px'}}>🍎</span>
                       </div>
                       <p className="font-bold text-green-300">Good Foods</p>
                     </div>
                     <ul className="list-disc pl-5 text-sm">
                       <li>+10 to +30 score</li>
                       <li>+3 to +15 health</li>
                       <li>Makes your sperm longer</li>
                       <li>No coins from food</li>
                     </ul>
                   </div>
                   <div className="bg-red-900 bg-opacity-30 rounded-lg p-3">
                     <div className="flex items-center mb-2">
                       <div className="flex gap-1 mr-2">
                         <img src="/game-assets/bad1.png" alt="Bad Food" className="w-8 h-8" onError={(e) => {
                           (e.target as HTMLImageElement).style.display = 'none';
                           (e.target as HTMLImageElement).nextElementSibling!.textContent = "💀";
                         }} />
                         <span style={{display: 'none', fontSize: '24px'}}>💀</span>
                       </div>
                       <p className="font-bold text-red-300">Bad Foods</p>
                     </div>
                     <ul className="list-disc pl-5 text-sm">
                       <li>-5 to -25 score</li>
                       <li>-10 to -30 health</li>
                       <li>No growth effect</li>
                       <li>Avoid these!</li>
                     </ul>
                   </div>
                 </div>
               </div>
               
               <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
                 <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Creepster', cursive" }}>Characters & Coins</h4>
                 <div className="grid grid-cols-3 gap-2 mb-3">
                   {CHARACTERS.map(char => (
                     <div key={char.id} className="bg-black bg-opacity-30 rounded-lg p-2 text-center">
                       <div className="bg-gray-800 rounded-full w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                         <img 
                           src={`/game-assets/${char.imagePrefix}-1.png`}
                           alt={char.name}
                           className="w-10 h-10 object-contain"
                           style={{ imageRendering: 'pixelated' }}
                         />
                       </div>
                       <p className="font-bold text-xs">{char.name}</p>
                       <p className="text-xs flex items-center justify-center">
                         {char.id === 'neo' ? 'Free' : (
                           <><img src="/game-assets/coin.png" alt="Coin" className="w-4 h-4 mr-1" /> {char.price}</>
                         )}
                       </p>
                     </div>
                   ))}
                 </div>
                 <div className="text-center py-2 bg-yellow-900 bg-opacity-30 rounded-lg">
                   <p className="text-sm">You also earn bonus coins based on your score when the game ends!</p>
                 </div>
               </div>
               
               <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4">
                 <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Creepster', cursive" }}>Game Mechanics</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-black bg-opacity-30 p-2 rounded-lg flex items-center">
                     <div className="bg-gradient-to-r from-green-500 to-red-500 w-10 h-4 mr-2 rounded-full"></div>
                     <p className="text-sm"><strong>Health:</strong> Game ends at zero</p>
                   </div>
                   <div className="bg-black bg-opacity-30 p-2 rounded-lg flex items-center">
                     <div className="w-10 h-10 mr-2 relative">
                       <div className="absolute inset-0 border-2 border-white rounded-lg"></div>
                       <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                       <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                     </div>
                     <p className="text-sm"><strong>Walls:</strong> Pass through them</p>
                   </div>
                   <div className="bg-black bg-opacity-30 p-2 rounded-lg flex items-center">
                     <div className="w-10 h-10 mr-2 relative">
                       <div className="absolute w-3 h-3 bg-white rounded-full top-2 left-2"></div>
                       <div className="absolute w-3 h-3 bg-white rounded-full top-2 right-2"></div>
                       <div className="absolute w-3 h-3 bg-white rounded-full bottom-2 left-2"></div>
                       <div className="absolute w-3 h-3 bg-white rounded-full bottom-2 right-2"></div>
                     </div>
                     <p className="text-sm"><strong>Collisions:</strong> Reduce health</p>
                   </div>
                   <div className="bg-black bg-opacity-30 p-2 rounded-lg flex items-center">
                     <div className="w-10 h-10 mr-2 relative">
                       <div className="absolute w-4 h-4 rounded-full left-1 top-3 bg-green-400"></div>
                       <div className="absolute w-4 h-4 rounded-full right-1 top-3 bg-red-400"></div>
                     </div>
                     <p className="text-sm"><strong>Spawn:</strong> 1-2 new items</p>
                   </div>
                 </div>
               </div>
             </div>
          
          <button 
              onClick={() => setShowGameInfo(false)}
              className="mt-4 w-full py-3 bg-gradient-to-r from-pink-400 to-pink-600 text-white rounded-xl font-bold transform transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
              CLOSE
          </button>
          </div>
        </div>
      )}
      
      {(gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.PAUSED) && (
        <>
          {/* Game UI Header - More compact and improved layout */}
          <div className="w-full max-w-md mb-1 mt-0 px-1">
            {/* User profile picture and game stats bar */}
            <div className="bg-gradient-to-r from-pink-400 via-pink-300 to-pink-400 rounded-xl p-2 shadow-lg mb-1 border-2 border-pink-500">
              {/* User profile in game */}
              {user && (
                <div className="flex items-center mb-1">
                  <div className="flex-shrink-0">
                    {user.pfp ? (
                      <img 
                        src={user.pfp} 
                        alt={user.displayName || user.username} 
                        className="w-8 h-8 rounded-full border-2 border-white"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center border-2 border-white">
                        <span className="text-white font-bold text-xs">{(user.displayName || user.username || '?').charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-2 flex-grow">
                    <span className="text-xs font-bold text-pink-800">{user.displayName || user.username}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-12 gap-1 mb-0">
                <div className="bg-white bg-opacity-25 rounded-lg p-1 text-center col-span-3">
                  <p className="text-sm font-bold text-pink-900 m-0">
                    SCORE<br />{score}
                  </p>
                </div>
                
                <div className="bg-white bg-opacity-25 rounded-lg p-1 text-center col-span-3">
                  <p className="text-sm font-bold text-pink-900 m-0">
                    HIGH<br />{highScore}
                  </p>
                </div>
                
                <div className="bg-white bg-opacity-25 rounded-lg p-1 text-center col-span-2">
                  <p className="text-sm font-bold text-pink-900 m-0 flex items-center justify-center">
                    <img src="/game-assets/coin.png" alt="Coin" className="w-4 h-4" onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextSibling!.textContent = '🪙';
                    }} />
                    <span style={{display: 'none'}}>🪙</span> {currency}
                  </p>
                </div>

                <div className="flex justify-end items-center gap-1 col-span-4">
                  <button 
                    onClick={togglePause}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      togglePause();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="px-2 py-1 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-bold shadow-md border-2 border-pink-400 text-white"
                    style={{ fontFamily: "Arial, sans-serif", touchAction: "manipulation" }}
                  >
                    Pause
                  </button>
                  
                  <button 
                    onClick={returnToMenu}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      returnToMenu();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="px-2 py-1 bg-pink-700 hover:bg-pink-800 rounded-lg text-sm font-bold shadow-md border-2 border-pink-400 text-white"
                    style={{ fontFamily: "Arial, sans-serif", touchAction: "manipulation" }}
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          
            {/* Health Bar */}
            <div className="w-full bg-gray-300 rounded-full h-4 mb-1 border-2 border-gray-400 overflow-hidden shadow-md">
              <div 
                className={`h-full ${
                  health > 60 ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                  health > 30 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${health}%`, transition: 'width 0.3s ease-in-out' }}
              ></div>
            </div>
            <p className="text-xs text-center text-pink-900 font-bold">Health: {health}%</p>
          </div>
          
          {/* Game board - Full width with minimal margins, adjusted for mobile */}
          <div className="relative border-4 border-pink-500 bg-pink-200 shadow-lg rounded-lg overflow-hidden mb-1" 
               style={{ 
                 width: '96vw', 
                 maxWidth: '500px', 
                 height: '96vw', 
                 maxHeight: '500px', 
                 zIndex: 5 
               }}>
            {gameState === GAME_STATE.PAUSED && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20">
                <div className="text-center p-4 bg-pink-600 rounded-lg shadow-lg border-2 border-pink-300">
                  <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: "Arial, sans-serif" }}>Paused</h3>
                  <button 
                    onClick={togglePause}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      togglePause();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-400 rounded-lg mt-2 font-bold shadow-md border border-pink-300 w-full text-white"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    Resume
                  </button>
                  
                  <button 
                    onClick={returnToMenu}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      returnToMenu();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="px-4 py-2 bg-pink-700 hover:bg-pink-600 rounded-lg mt-2 font-bold shadow-md border border-pink-400 w-full text-white"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    Main Menu
                  </button>
                  
                  {/* Character selection in pause menu */}
                  <div className="mt-3">
                    <p className="text-sm mb-2 text-white" style={{ fontFamily: "Arial, sans-serif" }}>Current: {CHARACTERS.find(c => c.id === selectedCharacter)?.name}</p>
                    <div className="grid grid-cols-3 gap-2 justify-center mb-2">
                      {CHARACTERS.filter(c => unlockedCharacters[c.id]).map(character => (
                        <div 
                          key={character.id}
                          onClick={() => selectCharacter(character.id)}
                          className={`p-1 rounded-lg cursor-pointer ${selectedCharacter === character.id ? 'bg-pink-400 border-2 border-white' : 'bg-pink-300 border border-pink-300'}`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="bg-white bg-opacity-30 rounded-full p-1 mb-1">
                            <img 
                              src={`/game-assets/${character.imagePrefix}-1.png`}
                              alt={character.name} 
                                className="w-8 h-8 object-contain"
                                style={{ 
                                  imageRendering: 'pixelated',
                                  filter: 'contrast(1.15) drop-shadow(0 0 1px rgba(0,0,0,0.5))'
                                }}
                              />
                            </div>
                            <span className="text-[9px] mt-1 text-white font-bold">{character.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col h-full">
              {board.map((row, y) => (
                <div key={y} className="flex flex-row flex-1">
                  {row.map((cell, x) => (
                    <div 
                      key={`${x}-${y}`} 
                      className={`flex-1 relative ${cell === 'empty' ? 'bg-pink-200' : ''}`}
                      data-type={cell}
                    >
                      {/* Render sperm head separately based on sperm array instead of board state */}
                      {sperm.length > 0 && sperm[0].x === x && sperm[0].y === y && (
                        <div className="absolute inset-0" style={{ zIndex: 10 }}>
                          <div 
                            className="absolute"
                            style={{
                              width: `${FIXED_HEAD_SIZE * 1.15}%`, // Increased size by 15%
                              height: `${FIXED_HEAD_SIZE * 1.15}%`, // Increased size by 15%
                              left: '50%',
                              top: '50%',
                              transform: `translate(-50%, -50%) ${
                                direction === 'right' ? 'rotate(0deg)' : 
                                direction === 'down' ? 'rotate(90deg)' : 
                                direction === 'left' ? 'rotate(180deg)' : 
                                'rotate(-90deg)'
                              }`,
                            }}
                          >
                            <div className="absolute inset-0 bg-pink-200 rounded-full opacity-70" />
                            <img 
                              src={getCharacterImage(frameIndex)}
                              alt="Character Head" 
                              className="w-full h-full sperm-head-image"
                              style={{ 
                                objectFit: 'contain',
                                position: 'absolute',
                                display: 'block',
                                visibility: 'visible',
                                imageRendering: 'pixelated',
                                filter: 'contrast(1.15) drop-shadow(0 0 1px rgba(0,0,0,0.5))' // Enhanced contrast and shadow
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite error loop
                                target.src = '/game-assets/neo-head-1.png'; // Fallback to default image
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {cell.startsWith('food-') && renderFoodItem(cell)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* In-game message display - reduced size by 50% */}
          {message && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-75 p-2 rounded-lg shadow-lg text-sm font-bold text-pink-600 z-50 max-w-[150px]">
              {message}
            </div>
          )}

          {/* Game Control Buttons - Larger and positioned lower */}
          {gameState === GAME_STATE.PLAYING && (
            <>
              {/* Subtle separator - reduced margin */}
              <div className="w-[85%] max-w-[400px] h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent my-1 rounded-full opacity-60"></div>
              
              <div className="mt-4 mb-3 relative max-w-[280px] w-full mx-auto" style={{ height: 'min(180px, 28vh)', marginTop: '1.5rem' }}>
                {/* Direction buttons in a cross layout - increased size */}
                <div className="absolute" style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}>
                  <button
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleButtonClick('up');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={() => handleButtonClick('up')}
                    className="w-[58px] h-[58px] sm:w-[70px] sm:h-[70px] rounded-full bg-gradient-to-b from-pink-400 to-pink-600 text-white flex items-center justify-center text-2xl transform hover:scale-105 active:scale-95 shadow-lg border-3 border-pink-300 active:from-pink-600 active:to-pink-800 transition-all duration-100"
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", boxShadow: "0 4px 10px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.2)" }}
                    aria-label="Move up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" strokeWidth="0.5" stroke="white">
                      <path d="M12 5l-8 8h5v6h6v-6h5z" />
                    </svg>
                  </button>
                </div>
                
                <div className="absolute" style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}>
                  <button
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleButtonClick('left');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={() => handleButtonClick('left')}
                    className="w-[58px] h-[58px] sm:w-[70px] sm:h-[70px] rounded-full bg-gradient-to-b from-pink-400 to-pink-600 text-white flex items-center justify-center text-2xl transform hover:scale-105 active:scale-95 shadow-lg border-3 border-pink-300 active:from-pink-600 active:to-pink-800 transition-all duration-100"
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", boxShadow: "0 4px 10px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.2)" }}
                    aria-label="Move left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" strokeWidth="0.5" stroke="white">
                      <path d="M5 12l8-8v5h6v6h-6v5z" />
                    </svg>
                  </button>
                </div>
                
                <div className="absolute" style={{ right: 0, top: '50%', transform: 'translateY(-50%)' }}>
                  <button
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleButtonClick('right');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={() => handleButtonClick('right')}
                    className="w-[58px] h-[58px] sm:w-[70px] sm:h-[70px] rounded-full bg-gradient-to-b from-pink-400 to-pink-600 text-white flex items-center justify-center text-2xl transform hover:scale-105 active:scale-95 shadow-lg border-3 border-pink-300 active:from-pink-600 active:to-pink-800 transition-all duration-100"
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", boxShadow: "0 4px 10px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.2)" }}
                    aria-label="Move right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" strokeWidth="0.5" stroke="white">
                      <path d="M19 12l-8 8v-5h-6v-6h6v-5z" />
                    </svg>
                  </button>
                </div>
                
                <div className="absolute" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
                  <button
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleButtonClick('down');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={() => handleButtonClick('down')}
                    className="w-[58px] h-[58px] sm:w-[70px] sm:h-[70px] rounded-full bg-gradient-to-b from-pink-400 to-pink-600 text-white flex items-center justify-center text-2xl transform hover:scale-105 active:scale-95 shadow-lg border-3 border-pink-300 active:from-pink-600 active:to-pink-800 transition-all duration-100"
                    style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", boxShadow: "0 4px 10px rgba(0,0,0,0.3), inset 0 -2px 5px rgba(0,0,0,0.2)" }}
                    aria-label="Move down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor" strokeWidth="0.5" stroke="white">
                      <path d="M12 19l8-8h-5v-6h-6v6h-5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      
      {gameState === GAME_STATE.GAMEOVER && (
        <div className="fixed inset-0 bg-gradient-to-b from-pink-200 to-pink-300 flex items-center justify-center z-50 w-full h-full" style={{ paddingTop: '5vh' }}>
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 rounded-lg text-center shadow-lg w-96 max-w-[95%] border-4 border-pink-300">
            <h2 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1.5rem, 8vw, 2rem)' }}>Game Over!</h2>
            
            {/* User profile at game over - display Farcaster profile from context or signed in user */}
            {(farcasterUser || user) && (
              <div className="flex justify-center mb-4">
                <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
                  {(farcasterUser?.pfp || user?.pfp) ? (
                    <img 
                      src={farcasterUser?.pfp || user?.pfp} 
                      alt={(farcasterUser?.displayName || farcasterUser?.username || user?.displayName || user?.username)} 
                      className="w-8 h-8 rounded-full mr-2 border-2 border-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center mr-2 border-2 border-white">
                      <span className="text-white font-bold text-xs">
                        {(farcasterUser?.displayName || farcasterUser?.username || user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="font-bold text-white text-sm">
                    {farcasterUser?.displayName || farcasterUser?.username || user?.displayName || user?.username}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-white mb-1">SCORE</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Eater', cursive" }}>{score}</p>
              </div>
              
              <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-white mb-1">COINS</p>
                <p className="text-2xl font-bold text-white flex items-center justify-center">
                  <span className="text-yellow-300 mr-2">+</span>
                  {Math.floor(score / 10)}
                </p>
              </div>
            </div>
            
            {score >= highScore && score > 0 && (
              <div className="mb-5 py-2 bg-yellow-500 bg-opacity-30 rounded-lg">
                <p className="text-yellow-300 font-bold" style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1.2rem, 5vw, 1.5rem)' }}>★ New High Score! ★</p>
              </div>
            )}
            
            {/* Add Cast button */}
            <button 
              onClick={handleCastScore}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleCastScore();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="px-4 py-3 w-full bg-purple-500 hover:bg-purple-400 text-white rounded-lg shadow-md border-2 border-purple-300 font-bold mb-4"
              style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1rem, 5vw, 1.3rem)' }}
            >
              <div className="flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M128 42.666C185.856 42.666 232.889 90.368 232.889 149.099C232.889 207.829 185.856 255.532 128 255.532C70.144 255.532 23.111 207.829 23.111 149.099C23.111 90.368 70.144 42.666 128 42.666Z" fill="white"/>
                  <path d="M190.345 109.263C190.345 143.788 167.881 171.703 139.636 171.703C124.79 171.703 116.056 164.35 112.446 156.913C109.549 162.089 104.459 166.359 96.366 166.359C81.4187 166.359 69.2744 150.955 69.2744 130.923C69.2744 110.636 81.162 96.1782 96.366 96.1782C103.861 96.1782 109.035 100.018 112.017 105.451C116.142 96.6212 126.064 90.1473 139.636 90.1473C167.881 90.1473 190.345 118.062 190.345 109.263ZM176.258 109.263C176.258 125.111 160.383 138.444 139.636 138.444C118.889 138.444 102.928 125.024 102.928 109.263C102.928 93.5017 118.889 80.0812 139.636 80.0812C160.383 80.0812 176.258 93.4147 176.258 109.263ZM98.3201 118.841C96.1946 119.889 94.3256 121.625 93.0318 123.9C91.7379 126.175 91.0906 128.882 91.1911 131.619C91.2915 134.357 92.136 136.995 93.6246 139.15C95.1133 141.305 97.1585 142.869 99.5144 143.703C101.87 144.538 104.428 144.635 106.843 143.981C109.258 143.326 111.41 141.949 113.039 139.934C114.669 137.919 115.693 135.37 115.977 132.656C116.261 129.941 115.792 127.198 114.636 124.793C112.617 120.609 108.44 117.881 103.776 117.881C101.89 117.881 100.018 118.235 98.3201 118.841Z" fill="#854CE6"/>
                </svg>
                Share Score
              </div>
            </button>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={restartGame}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  restartGame();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="px-4 py-3 bg-pink-500 hover:bg-pink-400 text-white rounded-lg shadow-md border-2 border-pink-300 font-bold"
                style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1rem, 5vw, 1.3rem)' }}
              >
                Play Again
              </button>
              
              <button 
                onClick={returnToMenu}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  returnToMenu();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-md border-2 border-purple-400 font-bold"
                style={{ fontFamily: "Arial, sans-serif", fontSize: 'clamp(1rem, 5vw, 1.3rem)' }}
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 