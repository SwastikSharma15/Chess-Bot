import { useState, useCallback, useEffect } from 'react';
import { ChessEngine } from '../logic/engine.js';
import { ChessAI } from '../logic/ai.js';
import { AudioManager } from '../logic/audioManager.js';

export const useChessGame = (playerColor = 'white') => {
  const [engine] = useState(() => new ChessEngine());
  const [ai] = useState(() => new ChessAI(6)); // Increased depth for much stronger play
  const [audioManager] = useState(() => new AudioManager());
  
  const [gameState, setGameState] = useState(() => engine.getGameState());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });

  const playerColorCode = playerColor === 'white' ? 'w' : 'b';
  const aiColorCode = playerColor === 'white' ? 'b' : 'w';

  // Update game state
  const updateGameState = useCallback(() => {
    setGameState(engine.getGameState());
  }, [engine]);

  // Handle piece drop (drag and drop move)
  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
    // Only allow moves during player's turn
    if (gameState.currentPlayer !== playerColorCode || isThinking) {
      return false;
    }

    const result = engine.makeMove(sourceSquare, targetSquare);
    
    if (result.success) {
      // Track captured pieces
      if (result.move.captured) {
        const capturedColor = playerColor === 'white' ? 'white' : 'black';
        setCapturedPieces(prev => ({
          ...prev,
          [capturedColor]: [...prev[capturedColor], result.move.captured]
        }));
      }
      
      setLastMove({ from: sourceSquare, to: targetSquare });
      setSelectedSquare(null);
      setLegalMoves([]);
      updateGameState();
      
      // Play move sound
      const newGameState = engine.getGameState();
      audioManager.playMoveSound(result.move, newGameState);
      
      return true;
    }
    
    return false;
  }, [engine, gameState.currentPlayer, isThinking, updateGameState, playerColorCode, playerColor]);

  // Handle square click (for move selection)
  const onSquareClick = useCallback((square) => {
    // Only allow interaction during player's turn
    if (gameState.currentPlayer !== playerColorCode || isThinking) {
      return;
    }

    if (selectedSquare === square) {
      // Deselect if clicking the same square
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare && legalMoves.includes(square)) {
      // Make move if target square is legal
      const result = engine.makeMove(selectedSquare, square);
      
      if (result.success) {
        // Track captured pieces
        if (result.move.captured) {
          const capturedColor = playerColor === 'white' ? 'white' : 'black';
          setCapturedPieces(prev => ({
            ...prev,
            [capturedColor]: [...prev[capturedColor], result.move.captured]
          }));
        }
        
        setLastMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setLegalMoves([]);
        updateGameState();
        
        // Play move sound
        const newGameState = engine.getGameState();
        audioManager.playMoveSound(result.move, newGameState);
      }
    } else {
      // Select new square and show legal moves
      const moves = engine.getLegalMoves(square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setLegalMoves(moves);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  }, [selectedSquare, legalMoves, engine, gameState.currentPlayer, isThinking, updateGameState, playerColorCode, playerColor]);

  // AI move with faster response
  const makeAIMove = useCallback(async () => {
    if (gameState.currentPlayer !== aiColorCode || engine.isGameOver()) {
      return;
    }

    setIsThinking(true);
    
    // Slightly longer thinking time for stronger AI
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const aiMove = ai.getBestMove(engine.game);
      
      if (aiMove) {
        const result = engine.makeMove(aiMove.from, aiMove.to, aiMove.promotion);
        
        if (result.success) {
          // Track captured pieces
          if (result.move.captured) {
            const capturedColor = playerColor === 'white' ? 'black' : 'white';
            const capturedPiece = playerColor === 'white' ? result.move.captured.toUpperCase() : result.move.captured;
            setCapturedPieces(prev => ({
              ...prev,
              [capturedColor]: [...prev[capturedColor], capturedPiece]
            }));
          }
          
          setLastMove({ from: aiMove.from, to: aiMove.to });
          updateGameState();
          
          // Play move sound
          const newGameState = engine.getGameState();
          audioManager.playMoveSound(result.move, newGameState);
        }
      }
    } catch (error) {
      console.error('AI move error:', error);
      // Fallback to quick move
      try {
        const quickMove = ai.getQuickMove(engine);
        if (quickMove) {
          const result = engine.makeMove(quickMove.from, quickMove.to, quickMove.promotion);
          if (result.success) {
            if (result.move.captured) {
              const capturedColor = playerColor === 'white' ? 'black' : 'white';
              const capturedPiece = playerColor === 'white' ? result.move.captured.toUpperCase() : result.move.captured;
              setCapturedPieces(prev => ({
                ...prev,
                [capturedColor]: [...prev[capturedColor], capturedPiece]
              }));
            }
            setLastMove({ from: quickMove.from, to: quickMove.to });
            updateGameState();
            
            // Play move sound
            const newGameState = engine.getGameState();
            audioManager.playMoveSound(result.move, newGameState);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback move error:', fallbackError);
      }
    } finally {
      setIsThinking(false);
    }
  }, [engine, ai, gameState.currentPlayer, updateGameState, aiColorCode, playerColor, audioManager]);

  // Auto-trigger AI move when it's AI's turn
  useEffect(() => {
    if (gameState.currentPlayer === aiColorCode && !engine.isGameOver() && !isThinking) {
      makeAIMove();
    }
  }, [gameState.currentPlayer, makeAIMove, engine, isThinking, aiColorCode]);

  // New game
  const startNewGame = useCallback(() => {
    engine.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setIsThinking(false);
    setCapturedPieces({ white: [], black: [] });
    updateGameState();
    audioManager.playStartSound();
  }, [engine, updateGameState, audioManager]);

  // Undo move (undo both player and AI moves)
  const undoMove = useCallback(() => {
    if (gameState.moveHistory.length >= 2 && !isThinking) {
      // Undo AI move
      engine.undoMove();
      // Undo player move
      engine.undoMove();
      
      // Reset captured pieces (simplified - would need move history to be accurate)
      setCapturedPieces({ white: [], black: [] });
      
      setSelectedSquare(null);
      setLegalMoves([]);
      setLastMove(null);
      updateGameState();
    }
  }, [engine, gameState.moveHistory.length, isThinking, updateGameState]);

  return {
    // Game state
    position: gameState.position,
    currentPlayer: gameState.currentPlayer,
    gameStatus: engine.getGameStatus(),
    moveHistory: gameState.moveHistory,
    isPlayerTurn: gameState.currentPlayer === playerColorCode && !isThinking,
    isThinking,
    capturedPieces,
    
    // UI state
    selectedSquare,
    legalMoves,
    lastMove,
    
    // Actions
    onPieceDrop,
    onSquareClick,
    startNewGame
  };
};