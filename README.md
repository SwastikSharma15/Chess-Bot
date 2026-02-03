# Chess Game

A fully functional chess game built with React, featuring human vs AI gameplay with a clean, responsive interface.

## Features

- **Human vs AI Chess Game**: Play against a Minimax AI opponent
- **Complete Chess Rules**: Legal move validation, check/checkmate detection, pawn promotion
- **Interactive UI**: Drag & drop pieces, click to move, visual move highlighting
- **Responsive Design**: Works on desktop and mobile devices
- **No Scrolling**: Entire game fits in viewport
- **Move History**: Track and review game moves
- **Undo Function**: Undo both player and AI moves

## Tech Stack

- **React 19** - Functional components with hooks
- **Tailwind CSS 4** - Utility-first styling
- **Vite** - Fast build tool and dev server
- **chess.js** - Chess rules and move validation
- **react-chessboard** - Interactive chess board component

## Libraries Used

- **chess.js**: Handles all chess rules, move validation, and game state management. Essential for ensuring legal moves and proper game flow.
- **react-chessboard**: Provides the interactive chess board UI with drag & drop functionality. Lightweight and customizable for our needs.

## Architecture

```
src/
├── components/
│   ├── ChessBoard.jsx     # Chess board UI component
│   └── GameControls.jsx   # Game controls and status display
├── logic/
│   ├── engine.js          # Chess game engine wrapper
│   └── ai.js              # Minimax AI implementation
├── hooks/
│   └── useChessGame.js    # Main game state management hook
└── App.jsx                # Main application component
```

## Game State Management

The game state is managed through a custom React hook (`useChessGame`) that:
- Wraps the chess.js library for game logic
- Manages UI state (selected squares, legal moves, highlights)
- Coordinates between human moves and AI responses
- Handles game flow and turn management

## AI Decision Making

The AI uses a **Minimax algorithm with alpha-beta pruning**:
- **Depth 3** search for good performance vs strength balance
- **Position evaluation** based on piece values and positional bonuses
- **Move ordering** prioritizes captures and checks for better pruning
- **Fallback system** ensures AI always makes a legal move

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chess-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## How to Play

1. **White pieces** (human) always move first
2. **Drag and drop** pieces or **click** to select and move
3. **Legal moves** are highlighted when a piece is selected
4. **AI automatically responds** after your move
5. Use **New Game** to restart or **Undo Move** to take back moves

## Game Rules Implemented

- ✅ Legal move validation for all pieces
- ✅ Turn-based gameplay
- ✅ Piece captures
- ✅ Check and checkmate detection
- ✅ Stalemate and draw conditions
- ✅ Pawn promotion (auto-promotes to Queen)
- ✅ Move history tracking

## Performance Notes

- AI thinking time is limited to maintain responsive gameplay
- Board updates are optimized to prevent unnecessary re-renders
- Game state is efficiently managed to handle rapid move sequences

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers on iOS and Android