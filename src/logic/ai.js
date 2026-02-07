import { Chess } from 'chess.js';

export class ChessAI {
  constructor(depth = 5) {
    this.depth = depth; // default stronger depth
    this.pieceValues = {
      'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
    };
    
    // Position tables for better piece placement
    this.pawnTable = [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5,  5, 10, 25, 25, 10,  5,  5],
      [0,  0,  0, 20, 20,  0,  0,  0],
      [5, -5,-10,  0,  0,-10, -5,  5],
      [5, 10, 10,-20,-20, 10, 10,  5],
      [0,  0,  0,  0,  0,  0,  0,  0]
    ];
    
    this.knightTable = [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ];
    
    this.bishopTable = [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10, 10, 10, 10, 10, 10, 10,-10],
      [-10,  5,  0,  0,  0,  0,  5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ];
  }

  // Main AI function with minimax and alpha-beta pruning
  getBestMove(game) {
    const chess = new Chess(game.getFen());
    const moves = chess.moves({ verbose: true });

    if (moves.length === 0) return null;

    const aiColor = chess.turn(); // color to move (AI)

    // Order moves: captures and checks first (simple MVV-LVA)
    const scoredMoves = moves.map(m => {
      let score = 0;
      if (m.captured) score += this.pieceValues[m.captured] - this.pieceValues[m.piece];
      return { move: m, score };
    }).sort((a, b) => b.score - a.score);

    let bestMove = null;
    let bestScore = -Infinity;

    for (const { move } of scoredMoves) {
      chess.move(move);
      const score = this.minimax(chess, this.depth - 1, -Infinity, Infinity, aiColor);
      chess.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove || moves[0];
  }

  // Minimax algorithm with alpha-beta pruning, color-aware
  // `maximizingColor` is the color ('w' or 'b') the AI is maximizing for
  minimax(chess, depth, alpha, beta, maximizingColor) {
    if (depth === 0 || chess.isGameOver()) {
      const evalScore = this.evaluatePosition(chess);
      return maximizingColor === 'w' ? evalScore : -evalScore;
    }

    const moves = chess.moves({ verbose: true });

    if (chess.turn() === maximizingColor) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, maximizingColor);
        chess.undo();

        if (evaluation > maxEval) maxEval = evaluation;
        if (evaluation > alpha) alpha = evaluation;
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = this.minimax(chess, depth - 1, alpha, beta, maximizingColor);
        chess.undo();

        if (evaluation < minEval) minEval = evaluation;
        if (evaluation < beta) beta = evaluation;
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Comprehensive position evaluation
  evaluatePosition(chess) {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -20000 : 20000;
    }
    
    if (chess.isDraw() || chess.isStalemate()) {
      return 0;
    }

    let score = 0;
    const board = chess.board();

    // Evaluate material and position
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const pieceValue = this.pieceValues[piece.type];
          const positionValue = this.getPositionValue(piece, i, j);
          
          if (piece.color === 'w') {
            score += pieceValue + positionValue;
          } else {
            score -= pieceValue + positionValue;
          }
        }
      }
    }

    // Bonus for castling rights
    if (chess.getCastlingRights('w').k) score += 30;
    if (chess.getCastlingRights('w').q) score += 20;
    if (chess.getCastlingRights('b').k) score -= 30;
    if (chess.getCastlingRights('b').q) score -= 20;

    // Penalty for being in check
    if (chess.inCheck()) {
      score += chess.turn() === 'w' ? -50 : 50;
    }

    // Mobility bonus (number of legal moves)
    const moves = chess.moves().length;
    score += chess.turn() === 'w' ? moves * 2 : -moves * 2;

    return score;
  }

  // Get position value based on piece tables
  getPositionValue(piece, row, col) {
    const adjustedRow = piece.color === 'w' ? 7 - row : row;
    
    switch (piece.type) {
      case 'p':
        return this.pawnTable[adjustedRow][col];
      case 'n':
        return this.knightTable[adjustedRow][col];
      case 'b':
        return this.bishopTable[adjustedRow][col];
      case 'r':
        return piece.color === 'w' ? 
          (row === 7 ? 0 : 10) : (row === 0 ? 0 : 10); // Rook activity
      case 'q':
        return 0; // Queen is strong anywhere
      case 'k':
        // King safety in early/mid game, activity in endgame
        const pieceCount = this.countPieces(piece);
        return pieceCount > 10 ? -Math.abs(3.5 - col) * 10 : 0;
      default:
        return 0;
    }
  }

  // Count pieces for endgame detection
  countPieces(chess) {
    // Use fen to count pieces instead of board() method
    const fen = chess.fen();
    const pieces = fen.split(' ')[0]; // Get piece placement part
    let count = 0;
    for (let char of pieces) {
      if (char !== '/' && isNaN(char)) {
        count++;
      }
    }
    return count;
  }

  // Fallback - improved quick move selection
  getQuickMove(game) {
    const chess = new Chess(game.getFen());
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) return null;
    
    // Prioritize good moves
    const scoredMoves = moves.map(move => {
      let score = 0;
      
      // Captures
      if (move.captured) {
        score += this.pieceValues[move.captured] - this.pieceValues[move.piece];
      }
      
      // Checks
      chess.move(move);
      if (chess.inCheck()) score += 50;
      if (chess.isCheckmate()) score += 1000;
      chess.undo();
      
      // Center control
      if (['d4', 'd5', 'e4', 'e5'].includes(move.to)) score += 20;
      
      // Development
      if (['b1', 'g1', 'b8', 'g8'].includes(move.from) && move.piece === 'n') score += 15;
      if (['c1', 'f1', 'c8', 'f8'].includes(move.from) && move.piece === 'b') score += 15;
      
      return { move, score };
    });

    // Sort by score and pick the best
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }
}