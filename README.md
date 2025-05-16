# Sperm Survival - Farcaster Mini-App

A fun and engaging arcade-style game built as a Farcaster Mini-App with blockchain integration on Monad testnet.

## 🎮 Game Overview

Sperm Survival is a Snake-like game with a biological twist, where you control a sperm cell navigating through a hazardous environment. The goal is to collect good nutrients, avoid harmful substances, and achieve the highest score possible.

## ✨ Features

### Core Gameplay
- **Snake-like mechanics**: Control your sperm character with keyboard arrows, WASD, or touch controls
- **Health system**: Monitor your health bar, which decreases when hitting obstacles or bad food
- **Score system**: Earn points by collecting good nutrients
- **Wall-passing**: Navigate freely as your sperm can pass through screen edges
- **Multiple characters**: Choose from a variety of unique characters with different visuals

### Character System
- **Default character**: Neo is unlocked by default
- **Unlockable characters**:
  - Naruto 
  - Flash 
  - Elon 
  - Superman 
  - Trump 

### Egg System
- Four different egg types with varying costs and rewards:
  - **Bronze**: 5 SPERM cost, 1-10 SPERM reward or 0.000001 BTC (1% chance)
  - **Silver**: 15 SPERM cost, 5-25 SPERM reward or 0.000005 BTC (3% chance)
  - **Gold**: 30 SPERM cost, 20-50 SPERM reward or 0.00002 BTC (5% chance)
  - **Diamond**: 50 SPERM cost, 50-100 SPERM reward or 0.0001 BTC (10% chance)

### Farcaster Integration
- **Authentication**: Log in with your Farcaster account
- **Casting**: Share your high scores directly to Farcaster
- **Add Frame**: Save the mini-app to your Farcaster client
- **User profile**: Display your Farcaster profile within the game

### Blockchain Integration
- **Monad Testnet**: Integration with Monad blockchain for on-chain assets
- **Smart contract**: Unified contract for token minting and player management
- **Wallet connection**: Support for both Farcaster's native wallet and external wallets like MetaMask

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- A Farcaster account
- Monad Testnet MON for wallet interactions

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/sperm-survival.git
cd sperm-survival
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 How to Play

1. Log in with your Farcaster account or play as a guest
2. Select a character from those you've unlocked
3. Control your sperm using:
   - Arrow keys
   - WASD keys
   - Touch controls on mobile
4. Collect good food (blue/green) to increase your score and health
5. Avoid bad food (red/purple) which decreases your health
6. Pass through walls to appear on the opposite side
7. Game ends when your health reaches zero
8. Use earned SPERM coins to buy eggs or unlock new characters

## 💻 Technologies Used

- **Frontend**: Next.js, React, TailwindCSS
- **Authentication**: Farcaster Auth Kit, Next-Auth
- **Blockchain**: Monad Testnet, Viem, Wagmi
- **Frame Integration**: Farcaster Frame SDK
- **API Integration**: Neynar SDK

## 🧰 Project Structure

```
sperm-survival/
├── public/               # Static assets
│   ├── game-assets/      # Game images and sprites
│   └── images/           # UI images
├── src/                  # Source code
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   └── utils/            # Helper utilities
├── .env.local            # Environment variables
├── next.config.js        # Next.js configuration
└── package.json          # Dependencies
```

## 📱 Farcaster Mini-App Features

- **Frame support**: Full implementation of Farcaster Frames protocol
- **Onchain actions**: Connect wallet and perform blockchain operations
- **Social sharing**: Share scores and achievements on Farcaster
- **Leaderboard**: Compare your scores with other players

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Deploy to Vercel
npm run deploy:vercel

# Generate game assets
npm run generate-images
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Farcaster team for the Frame SDK
- Neynar for API integration
- Monad team for testnet support
- All contributors and players 
