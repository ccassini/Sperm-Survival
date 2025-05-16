# Snake Game Graphics

This folder contains the custom graphics used for the snake game.

## Required Images

The game requires the following PNG images:

1. `snake-head.png` - The snake's head (should be rotatable)
2. `snake-body.png` - The snake's body segments
3. `snake-food.png` - The food items the snake eats

## Image Requirements

- **Size**: 24x24 pixels for desktop, 20x20 pixels for mobile (the game scales appropriately)
- **Format**: PNG with transparency
- **Style**: Keep consistent style across all graphics for a cohesive look

## Notes on snake-head.png

The snake head image should be designed facing upward (direction: 'up') as the default orientation. The game automatically rotates the image based on the snake's movement direction:

- Up: 0 degrees (default)
- Right: 90 degrees 
- Down: 180 degrees
- Left: -90 degrees

## Placeholder Images

If you're missing any images, you can generate placeholder images by running:

```
npm install canvas
node scripts/generate-placeholder-images.js
```

This will create simple placeholder images that you can replace with your custom graphics. 