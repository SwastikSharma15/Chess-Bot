import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const PIECE_SYMBOLS = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const PIECE_VALUES = {
  'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0,
  'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0
};

const CapturedPieces = ({ pieces, color, title }) => {
  const containerRef = useRef(null);
  const prevPiecesLength = useRef(pieces.length);
  
  const sortedPieces = [...pieces].sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]);
  
  // Animate new captured pieces
  useEffect(() => {
    if (pieces.length > prevPiecesLength.current && containerRef.current) {
      const newPieces = containerRef.current.querySelectorAll('.captured-piece');
      const lastPiece = newPieces[newPieces.length - 1];
      
      if (lastPiece) {
        gsap.fromTo(lastPiece, 
          { scale: 0, rotation: 180, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );
      }
    }
    prevPiecesLength.current = pieces.length;
  }, [pieces.length]);

  const getPieceStyle = (piece) => {
    // Style pieces based on color for better visibility
    if (piece === piece.toUpperCase()) {
      // White pieces - white with dark shadow
      return "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]";
    } else {
      // Black pieces - will be styled with inline styles
      return "";
    }
  };

  return (
    <div className="chess-panel rounded-xl shadow-lg p-4">
      <div className="chess-label mb-3">{title}</div>
      <div 
        ref={containerRef}
        className="flex flex-wrap gap-2 min-h-[48px] items-start"
      >
        {sortedPieces.length > 0 ? (
          sortedPieces.map((piece, index) => (
            <div
              key={`${piece}-${index}`}
              className={`captured-piece text-xl ${getPieceStyle(piece)} chess-interactive hover:scale-110`}
              style={
                piece === piece.toLowerCase() 
                  ? { 
                      color: '#000000', 
                      textShadow: '0 1px 2px rgba(255,255,255,0.6)',
                      WebkitTextFillColor: '#000000'
                    }
                  : {}
              }
            >
              {PIECE_SYMBOLS[piece]}
            </div>
          ))
        ) : (
          <div className="text-stone-400 text-sm italic font-medium">
            No pieces captured
          </div>
        )}
      </div>
      
      {/* Material advantage indicator */}
      {sortedPieces.length > 0 && (
        <div className="mt-2 pt-2 border-t border-stone-200">
          <div className="text-xs text-stone-500">
            Material: +{sortedPieces.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CapturedPieces;