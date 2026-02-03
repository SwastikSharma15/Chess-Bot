import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import CustomChessBoard from './components/CustomChessBoard.jsx';
import CapturedPieces from './components/CapturedPieces.jsx';
import { useChessGame } from './hooks/useChessGame.js';

const App = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState('white');
  const [boardFlipped, setBoardFlipped] = useState(false);

  const {
    position,
    currentPlayer,
    gameStatus,
    moveHistory,
    isPlayerTurn,
    isThinking,
    selectedSquare,
    legalMoves,
    lastMove,
    capturedPieces,
    onPieceDrop,
    onSquareClick,
    startNewGame
  } = useChessGame(playerColor);

  const statusRef = useRef(null);
  const thinkingRef = useRef(null);
  const moveHistoryRef = useRef(null);

  // Main game screen functions
  const getStatusMessage = () => {
    if (isThinking) return "AI is calculating...";
    
    const currentPlayerName = currentPlayer === 'w' ? 'White' : 'Black';
    const isPlayersTurn = (playerColor === 'white' && currentPlayer === 'w') || 
                         (playerColor === 'black' && currentPlayer === 'b');
    
    switch (gameStatus) {
      case 'checkmate':
        const winner = currentPlayer === 'w' ? 'Black' : 'White';
        return `${winner} wins by checkmate!`;
      case 'stalemate':
        return 'Game ended in stalemate';
      case 'draw':
        return 'Game ended in a draw';
      case 'check':
        return `${currentPlayerName} is in check`;
      default:
        return isPlayersTurn ? 'Your turn' : `AI (${currentPlayerName}) to move`;
    }
  };

  const getStatusColor = () => {
    if (isThinking) return 'text-blue-600';
    if (gameStatus === 'checkmate') return 'text-red-600';
    if (gameStatus === 'check') return 'text-amber-600';
    if (gameStatus === 'stalemate' || gameStatus === 'draw') return 'text-stone-600';
    return 'text-stone-800';
  };

  // Format move history like: 1. e4 e5 2. Nf3 Nc6 (reversed order - latest first)
  const formatMoveHistory = () => {
    const moves = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1];
      moves.push({ moveNumber, whiteMove, blackMove });
    }
    return moves.reverse(); // Reverse to show latest moves first
  };

  const handleStartGame = (color) => {
    setPlayerColor(color);
    setBoardFlipped(color === 'black');
    setGameStarted(true);
    // Start new game after setting the color
    setTimeout(() => startNewGame(), 0);
  };

  const handleNewGame = () => {
    setGameStarted(false);
    setBoardFlipped(false);
    setPlayerColor('white');
  };

  const handleFlipBoard = () => {
    setBoardFlipped(!boardFlipped);
  };

  // Animate status changes
  useEffect(() => {
    if (statusRef.current && gameStarted) {
      gsap.fromTo(statusRef.current, 
        { opacity: 0.5, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [gameStatus, currentPlayer, isThinking, gameStarted]);

  // Animate thinking indicator
  useEffect(() => {
    if (isThinking && thinkingRef.current && gameStarted) {
      gsap.to(thinkingRef.current, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: "none"
      });
    }
  }, [isThinking, gameStarted]);

  // Auto-scroll move history to show latest move at top (no scrolling needed since latest is at top)
  useEffect(() => {
    if (moveHistoryRef.current && moveHistory.length > 0) {
      const container = moveHistoryRef.current;
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [moveHistory]);

  // Color selection screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-orange-200 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="chess-title text-6xl text-amber-900 mb-4">
            Chess Master
          </h1>
          <p className="chess-subtitle text-xl text-amber-700 mb-12">
            Choose your side
          </p>
          
          <div className="flex gap-8 justify-center">
            {/* White pieces option */}
            <button
              onClick={() => handleStartGame('white')}
              className="chess-button group bg-gradient-to-br from-stone-100 to-stone-200 hover:from-stone-200 hover:to-stone-300 border-2 border-stone-300 rounded-2xl p-8 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4 text-stone-800">♔</div>
                <h3 className="chess-value text-xl text-stone-800 mb-2">Play as White</h3>
                <p className="text-stone-600 text-sm">You move first</p>
              </div>
            </button>

            {/* Black pieces option */}
            <button
              onClick={() => handleStartGame('black')}
              className="chess-button group bg-gradient-to-br from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 border-2 border-stone-600 rounded-2xl p-8 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4 text-white">♚</div>
                <h3 className="chess-value text-xl text-white mb-2">Play as Black</h3>
                <p className="text-stone-300 text-sm">AI moves first</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main game screen JSX
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-orange-200 flex items-center justify-center p-6">
      <div className="flex items-center gap-8 max-w-7xl w-full">
        
        {/* Left Panel - Game Info */}
        <div className="w-80 space-y-6">
          {/* Game Controls */}
          <div className="chess-panel rounded-xl shadow-lg p-6">
            <div className="flex gap-3">
              <button
                onClick={handleNewGame}
                disabled={isThinking}
                className="chess-button flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                New Game
              </button>
              <button
                onClick={handleFlipBoard}
                disabled={isThinking}
                className="chess-button flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Flip Board
              </button>
            </div>
          </div>

          {/* Game Status */}
          <div className="chess-panel rounded-xl shadow-lg p-6">
            <div className="chess-label mb-3">Game Status</div>
            <div 
              ref={statusRef}
              className={`chess-value text-lg ${getStatusColor()}`}
            >
              {getStatusMessage()}
            </div>
            
            {isThinking && (
              <div className="mt-4 flex items-center gap-3">
                <div 
                  ref={thinkingRef}
                  className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                ></div>
                <span className="text-sm text-stone-600 font-medium">
                  Analyzing position...
                </span>
              </div>
            )}
          </div>

          {/* Captured Pieces */}
          <CapturedPieces 
            pieces={capturedPieces.black} 
            color="black" 
            title="Black Captured" 
          />
          
          <CapturedPieces 
            pieces={capturedPieces.white} 
            color="white" 
            title="White Captured" 
          />
        </div>

        {/* Center - Chess Board */}
        <div className="flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="chess-title text-4xl text-amber-900 mb-2">
              Chess Master
            </h1>
            <p className="chess-subtitle text-amber-700">
              Playing as {playerColor === 'white' ? 'White' : 'Black'}
            </p>
          </div>
          
          <CustomChessBoard
            position={position}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            isPlayerTurn={isPlayerTurn}
            flipped={boardFlipped}
          />
        </div>

        {/* Right Panel - Move History */}
        <div className="w-80">
          {moveHistory.length > 0 && (
            <div className="chess-panel rounded-xl shadow-lg p-6">
              <div className="chess-label mb-4">Move History</div>
              <div 
                ref={moveHistoryRef}
                className="max-h-96 overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-2">
                  {formatMoveHistory().map((move, index) => {
                    const isLatestMove = index === 0; // Latest move is now at index 0
                    return (
                      <div 
                        key={move.moveNumber} 
                        className={`flex items-center gap-4 p-2 rounded-lg chess-interactive transition-colors duration-300 ${
                          isLatestMove 
                            ? 'bg-green-100 border border-green-300 shadow-sm' 
                            : 'hover:bg-amber-50'
                        }`}
                      >
                        <span className="chess-label w-6 text-center">
                          {move.moveNumber}.
                        </span>
                        <div className="flex gap-4 flex-1">
                          <span className="font-mono chess-value text-sm w-12">
                            {move.whiteMove}
                          </span>
                          {move.blackMove && (
                            <span className="font-mono chess-value text-sm w-12">
                              {move.blackMove}
                            </span>
                          )}
                        </div>
                        {isLatestMove && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {moveHistory.length === 0 && (
            <div className="chess-panel rounded-xl shadow-lg p-6">
              <div className="chess-label mb-3">Move History</div>
              <div className="text-amber-600 text-sm italic font-medium">
                No moves yet. Make your first move!
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar {
          scroll-behavior: smooth;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;