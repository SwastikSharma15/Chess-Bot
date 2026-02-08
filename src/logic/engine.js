import { Chess } from 'chess.js';

export class ChessEngine {
  constructor() {
    this.game = new Chess();
    this.moveHistory = [];
  }

  // Get current game state
  getGameState() {
    return {
      position: this.game.fen(),
      currentPlayer: this.game.turn(),
      isCheck: this.game.inCheck(),
      isCheckmate: this.game.isCheckmate(),
      isStalemate: this.game.isStalemate(),
      isDraw: this.game.isDraw(),
      moveHistory: this.moveHistory
    };
  }

  // Get game status for UI
  getGameStatus() {
    if (this.game.isCheckmate()) return 'checkmate';
    if (this.game.isStalemate()) return 'stalemate';
    if (this.game.isDraw()) return 'draw';
    if (this.game.inCheck()) return 'check';
    return 'playing';
  }

  // Make a move
  makeMove(from, to, promotion = 'q') {
    try {
      const move = this.game.move({
        from,
        to,
        promotion
      });

      if (move) {
        this.moveHistory.push(move.san);
        return {
          success: true,
          move: move,
          gameState: this.getGameState()
        };
      }
      return { success: false, error: 'Invalid move' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get legal moves for a square
  getLegalMoves(square) {
    const moves = this.game.moves({ square, verbose: true });
    return moves.map(move => move.to);
  }

  // Get all legal moves
  getAllLegalMoves() {
    return this.game.moves({ verbose: true });
  }

  // Undo last move
  undoMove() {
    const move = this.game.undo();
    if (move) {
      this.moveHistory.pop();
      return {
        success: true,
        gameState: this.getGameState()
      };
    }
    return { success: false };
  }

  // Reset game
  reset() {
    this.game.reset();
    this.moveHistory = [];
    return this.getGameState();
  }

  // Load position from FEN
  loadPosition(fen) {
    try {
      this.game.load(fen);
      return { success: true, gameState: this.getGameState() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if it's game over
  isGameOver() {
    return this.game.isGameOver();
  }

  // Get current FEN
  getFen() {
    return this.game.fen();
  }

  // Get ASCII representation (for debugging)
  getAscii() {
    return this.game.ascii();
  }
}