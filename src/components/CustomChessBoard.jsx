import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// Premium chess pieces with clear distinction
const PIECE_SYMBOLS = {
  // Black pieces - solid/filled
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
  // White pieces - outlined/hollow  
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const CustomChessBoard = ({ 
  position, 
  onPieceDrop, 
  onSquareClick,
  selectedSquare, 
  legalMoves, 
  lastMove,
  isPlayerTurn,
  flipped = false
}) => {
  const boardRef = useRef(null);
  const piecesRef = useRef({});

  // Parse FEN position to board array
  const parseFEN = (fen) => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const rows = fen.split(' ')[0].split('/');
    
    rows.forEach((row, rowIndex) => {
      let colIndex = 0;
      for (let char of row) {
        if (isNaN(char)) {
          board[rowIndex][colIndex] = char;
          colIndex++;
        } else {
          colIndex += parseInt(char);
        }
      }
    });
    
    return board;
  };

  const board = position === 'start' 
    ? parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    : parseFEN(position);

  const getSquareName = (row, col) => {
    return String.fromCharCode(97 + col) + (8 - row);
  };

  const getSquareColor = (row, col) => {
    // Wooden chess board colors with texture
    return (row + col) % 2 === 0 
      ? 'bg-gradient-to-br from-amber-100 to-amber-200' // Light squares - light wood with grain
      : 'bg-gradient-to-br from-amber-800 to-amber-900'; // Dark squares - dark wood with grain
  };

  const getSquareStyle = (row, col) => {
    const square = getSquareName(row, col);
    let classes = `w-16 h-16 flex items-center justify-center text-3xl cursor-pointer select-none relative chess-interactive ${getSquareColor(row, col)}`;
    
    // Hover effect for interactive squares
    if (isPlayerTurn) {
      classes += ' hover:brightness-110';
    }
    
    // Highlight selected square with elegant glow
    if (selectedSquare === square) {
      classes += ' ring-2 ring-amber-400 ring-inset shadow-lg shadow-amber-400/25';
    }
    
    // Highlight legal moves with subtle indicators
    if (legalMoves.includes(square)) {
      classes += ' ring-1 ring-emerald-400 ring-inset';
    }
    
    // Highlight last move with bright green color for both squares
    if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      if (lastMove.to === square) {
        // Destination square - very prominent bright green highlight
        classes += ' ring-4 ring-green-500 ring-inset bg-green-300/80 shadow-xl shadow-green-500/50';
      } else {
        // Source square - bright green highlight
        classes += ' ring-3 ring-green-400 ring-inset bg-green-200/70 shadow-lg shadow-green-400/40';
      }
    }
    
    return classes;
  };

  const handleClick = (row, col) => {
    const square = getSquareName(row, col);
    
    // Animate click feedback
    const squareElement = document.querySelector(`[data-square="${square}"]`);
    if (squareElement) {
      gsap.to(squareElement, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    }
    
    // If we have a selected square and this is a legal move, make the move
    if (selectedSquare && legalMoves.includes(square)) {
      onPieceDrop({ sourceSquare: selectedSquare, targetSquare: square });
    } else {
      // Otherwise, handle square selection
      onSquareClick(square);
    }
  };

  const getPieceStyle = (piece) => {
    // Enhanced piece styling with better contrast for wooden board
    if (piece && piece === piece.toUpperCase()) {
      // White pieces - light color with dark shadow
      return "text-stone-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-bold chess-interactive hover:scale-105";
    } else {
      // Black pieces - force pure black with light shadow
      return "font-bold chess-interactive hover:scale-105";
    }
  };

  // Animate piece movements
  useEffect(() => {
    if (lastMove) {
      const fromSquare = document.querySelector(`[data-square="${lastMove.from}"]`);
      const toSquare = document.querySelector(`[data-square="${lastMove.to}"]`);
      
      if (fromSquare && toSquare) {
        gsap.fromTo(toSquare.querySelector('.chess-piece'), 
          { scale: 1.2, opacity: 0.8 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
      }
    }
  }, [lastMove]);

  return (
    <div className="flex flex-col items-center">
      {/* Rank labels (8-1 or 1-8 when flipped) */}
      <div className="flex items-center mb-2">
        <div className="w-6 flex flex-col items-center mr-2">
          {(flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1]).map(num => (
            <div key={num} className="h-16 flex items-center text-xs font-medium text-amber-700">
              {num}
            </div>
          ))}
        </div>
        
        {/* Chess Board with wooden styling */}
        <div 
          ref={boardRef}
          className="relative border-2 border-amber-900 shadow-2xl bg-amber-900 rounded-lg overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(139, 69, 19, 0.3)'
          }}
        >
          {/* Board squares */}
          <div className="relative">
            {(flipped ? [...board].reverse() : board).map((row, displayRowIndex) => {
              const actualRowIndex = flipped ? 7 - displayRowIndex : displayRowIndex;
              return (
                <div key={actualRowIndex} className="flex">
                  {(flipped ? [...row].reverse() : row).map((piece, displayColIndex) => {
                    const actualColIndex = flipped ? 7 - displayColIndex : displayColIndex;
                    return (
                      <div
                        key={`${actualRowIndex}-${actualColIndex}`}
                        data-square={getSquareName(actualRowIndex, actualColIndex)}
                        className={getSquareStyle(actualRowIndex, actualColIndex)}
                        onClick={() => handleClick(actualRowIndex, actualColIndex)}
                      >
                        {/* Legal move indicator - elegant dots */}
                        {legalMoves.includes(getSquareName(actualRowIndex, actualColIndex)) && !piece && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full opacity-60 shadow-sm"></div>
                          </div>
                        )}
                        
                        {/* Legal capture indicator - subtle ring */}
                        {legalMoves.includes(getSquareName(actualRowIndex, actualColIndex)) && piece && (
                          <div className="absolute inset-0 ring-2 ring-emerald-400 ring-inset rounded-sm opacity-50"></div>
                        )}
                        
                        {/* Last move indicator - bright green dot for destination */}
                        {lastMove && lastMove.to === getSquareName(actualRowIndex, actualColIndex) && (
                          <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-600 rounded-full shadow-xl animate-pulse border-2 border-white"></div>
                        )}
                        
                        {/* Last move indicator - smaller green dot for source */}
                        {lastMove && lastMove.from === getSquareName(actualRowIndex, actualColIndex) && (
                          <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full shadow-lg border border-white"></div>
                        )}
                        
                        {/* Piece with enhanced styling */}
                        {piece && (
                          <span 
                            className={`chess-piece relative z-10 ${getPieceStyle(piece)}`}
                            style={
                              piece === piece.toLowerCase() 
                                ? { 
                                    color: '#000000', 
                                    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                                    WebkitTextFillColor: '#000000'
                                  }
                                : {}
                            }
                            ref={el => piecesRef.current[getSquareName(actualRowIndex, actualColIndex)] = el}
                          >
                            {PIECE_SYMBOLS[piece]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* File labels (a-h or h-a when flipped) */}
      <div className="flex ml-8">
        {(flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h']).map(letter => (
          <div key={letter} className="w-16 text-center text-xs font-medium text-amber-700">
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomChessBoard;