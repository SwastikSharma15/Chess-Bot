import { Chess } from 'chess.js';

// ─── Piece-Square Tables (white's perspective, rank 8 at row 0) ──────────────

const PAWN_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0],
];
const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];
const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];
const ROOK_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0],
];
const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];
const KING_MG_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20],
];
const KING_EG_TABLE = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50],
];

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const INF = 1_000_000;
const CHECKMATE_SCORE = 900_000;
const TT_EXACT = 0, TT_ALPHA = 1, TT_BETA = 2;

export class ChessAI {
  constructor(depth = 6) {
    this.maxDepth  = depth;
    this.timeLimit = 2500;   // ms per move
    this.ttSize    = 1 << 20;
    this.tt        = new Map();
    this.history   = { w: {}, b: {} };
    this.killers   = Array.from({ length: 64 }, () => [null, null]);
  }

  _initHistory() {
    this.history = { w: {}, b: {} };
    this.killers = Array.from({ length: 64 }, () => [null, null]);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  getBestMove(game) {
    const fen = game.getFen ? game.getFen() : game.fen();
    const chess = new Chess(fen);
    if (chess.isGameOver()) return null;

    this._initHistory();
    this.tt.clear();

    const startTime = Date.now();
    const aiColor   = chess.turn();
    let bestMove    = null;
    let bestScore   = -INF;

    // Iterative deepening
    for (let d = 1; d <= this.maxDepth; d++) {
      if (Date.now() - startTime > this.timeLimit * 0.65) break;
      const result = this._rootSearch(chess, d, aiColor, startTime);
      if (result.move) { bestMove = result.move; bestScore = result.score; }
      if (Math.abs(bestScore) >= CHECKMATE_SCORE - 100) break;
    }

    return bestMove || chess.moves({ verbose: true })[0];
  }

  // backward-compat fallback
  getQuickMove(game) { return this.getBestMove(game); }

  // ── Root search ─────────────────────────────────────────────────────────────

  _rootSearch(chess, depth, aiColor, startTime) {
    const moves   = this._orderMoves(chess, chess.moves({ verbose: true }), 0, null);
    let bestMove  = null;
    let bestScore = -INF;
    let alpha     = -INF;

    for (const move of moves) {
      if (Date.now() - startTime > this.timeLimit) break;
      chess.move(move);
      const score = -this._negamax(chess, depth - 1, -INF, -alpha, aiColor === 'w' ? 'b' : 'w', 1, startTime);
      chess.undo();
      if (score > bestScore) { bestScore = score; bestMove = move; }
      if (score > alpha) alpha = score;
    }
    return { move: bestMove, score: bestScore };
  }

  // ── Negamax + alpha-beta + TT ───────────────────────────────────────────────

  _negamax(chess, depth, alpha, beta, color, ply, startTime) {
    if (Date.now() - startTime > this.timeLimit) return 0;

    const key     = chess.fen();
    const ttEntry = this.tt.get(key);
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.type === TT_EXACT) return ttEntry.score;
      if (ttEntry.type === TT_ALPHA && ttEntry.score <= alpha) return alpha;
      if (ttEntry.type === TT_BETA  && ttEntry.score >= beta)  return beta;
    }

    if (chess.isCheckmate()) return -(CHECKMATE_SCORE - ply);
    if (chess.isDraw() || chess.isStalemate()) return 0;
    if (depth <= 0) return this._quiescence(chess, alpha, beta, color, ply + 1);

    const moves   = this._orderMoves(chess, chess.moves({ verbose: true }), ply, ttEntry?.bestMove ?? null);
    let ttType    = TT_ALPHA;
    let bestMv    = null;
    let bestSc    = -INF;

    for (const move of moves) {
      chess.move(move);
      const score = -this._negamax(chess, depth - 1, -beta, -alpha, color === 'w' ? 'b' : 'w', ply + 1, startTime);
      chess.undo();

      if (score > bestSc) { bestSc = score; bestMv = move; }
      if (score > alpha)  { alpha  = score; ttType = TT_EXACT; }

      if (alpha >= beta) {
        if (!move.captured) {
          const k    = this.killers[ply];
          const mkey = move.from + move.to;
          if (k[0] !== mkey) { k[1] = k[0]; k[0] = mkey; }
          this.history[color][mkey] = (this.history[color][mkey] || 0) + depth * depth;
        }
        ttType = TT_BETA;
        break;
      }
    }

    if (this.tt.size >= this.ttSize) this.tt.clear();
    this.tt.set(key, { depth, score: bestSc, type: ttType, bestMove: bestMv });
    return bestSc;
  }

  // ── Quiescence search ───────────────────────────────────────────────────────

  _quiescence(chess, alpha, beta, color, ply) {
    const stand = this._evaluate(chess, color);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;

    const captures = chess.moves({ verbose: true })
      .filter(m => m.captured || m.flags.includes('p'))
      .sort((a, b) => this._mvvLva(b) - this._mvvLva(a));

    for (const move of captures) {
      chess.move(move);
      const score = -this._quiescence(chess, -beta, -alpha, color === 'w' ? 'b' : 'w', ply + 1);
      chess.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  // ── Move ordering ───────────────────────────────────────────────────────────

  _orderMoves(chess, moves, ply, ttBest) {
    const cur = chess.turn();
    return moves
      .map(m => {
        let s   = 0;
        const k = m.from + m.to;
        if (ttBest && k === ttBest.from + ttBest.to)  s += 10000;
        if (m.captured)                                s += 1000 + this._mvvLva(m);
        if (m.flags && m.flags.includes('p'))          s += 900;
        const kl = this.killers[ply] || [];
        if (kl[0] === k) s += 800;
        if (kl[1] === k) s += 700;
        s += (this.history[cur]?.[k] || 0);
        return { move: m, score: s };
      })
      .sort((a, b) => b.score - a.score)
      .map(x => x.move);
  }

  _mvvLva(move) {
    return (PIECE_VALUES[move.captured || 'p'] * 10) - (PIECE_VALUES[move.piece] || 100);
  }

  // ── Evaluation ──────────────────────────────────────────────────────────────

  _evaluate(chess, colorToMax) {
    if (chess.isCheckmate())              return chess.turn() === colorToMax ? -CHECKMATE_SCORE : CHECKMATE_SCORE;
    if (chess.isDraw() || chess.isStalemate()) return 0;

    const board  = chess.board();
    const phase  = this._gamePhase(board);
    let   score  = 0;
    let   wBish  = 0, bBish = 0;
    const wP = new Array(8).fill(0);
    const bP = new Array(8).fill(0);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (!sq) continue;
        const isW  = sq.color === 'w';
        const sign = isW ? 1 : -1;
        score += sign * (PIECE_VALUES[sq.type] + this._pst(sq.type, r, c, isW, phase));
        if (sq.type === 'b') { isW ? wBish++ : bBish++; }
        if (sq.type === 'p') { isW ? wP[c]++ : bP[c]++; }
      }
    }

    // Bishop pair
    if (wBish >= 2) score += 30;
    if (bBish >= 2) score -= 30;

    // Pawn structure
    score += this._pawnStructure(wP,  1);
    score += this._pawnStructure(bP, -1);

    // Rook on open file
    score += this._rookBonus(board, wP, bP);

    // King safety (middlegame only)
    if (phase < 0.7) {
      score += this._kingSafety(board, 'w', wP, bP);
      score -= this._kingSafety(board, 'b', wP, bP);
    }

    // Mobility
    const myMoves = chess.moves().length;
    score += chess.turn() === colorToMax ? myMoves * 3 : -myMoves * 3;

    // Check penalty
    if (chess.inCheck()) score += chess.turn() === colorToMax ? -25 : 25;

    return colorToMax === 'w' ? score : -score;
  }

  _pst(type, row, col, isWhite, phase) {
    const r = isWhite ? 7 - row : row;
    switch (type) {
      case 'p': return PAWN_TABLE[r][col];
      case 'n': return KNIGHT_TABLE[r][col];
      case 'b': return BISHOP_TABLE[r][col];
      case 'r': return ROOK_TABLE[r][col];
      case 'q': return QUEEN_TABLE[r][col];
      case 'k': return Math.round(KING_MG_TABLE[r][col] * (1 - phase) + KING_EG_TABLE[r][col] * phase);
      default:  return 0;
    }
  }

  _gamePhase(board) {
    let mat = 0;
    const max = 2 * (2*500 + 2*320 + 2*330 + 900);
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type !== 'k' && sq.type !== 'p') mat += PIECE_VALUES[sq.type];
      }
    return Math.max(0, Math.min(1, 1 - mat / max));
  }

  _pawnStructure(fc, sign) {
    let bonus = 0;
    for (let f = 0; f < 8; f++) {
      if (!fc[f]) continue;
      if (fc[f] > 1) bonus -= sign * 20 * (fc[f] - 1);       // doubled
      const iso = (f === 0 || !fc[f-1]) && (f === 7 || !fc[f+1]);
      if (iso) bonus -= sign * 15;                             // isolated
    }
    return bonus;
  }

  _rookBonus(board, wP, bP) {
    let bonus = 0;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (!sq || sq.type !== 'r') continue;
        const open = (col) => !wP[col] && !bP[col];
        const semi = (col, mine) => !mine[col] && col < 8;
        if (sq.color === 'w') {
          if (open(c)) bonus += 20; else if (!wP[c]) bonus += 10;
        } else {
          if (open(c)) bonus -= 20; else if (!bP[c]) bonus -= 10;
        }
      }
    return bonus;
  }

  _kingSafety(board, color, wP, bP) {
    let kr = -1, kc = -1;
    outer: for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type === 'k' && sq.color === color) { kr = r; kc = c; break outer; }
      }
    if (kr === -1) return 0;

    const mine = color === 'w' ? wP : bP;
    const opp  = color === 'w' ? bP : wP;
    let safety = 0;

    for (let dc = -1; dc <= 1; dc++) {
      const fc = kc + dc;
      if (fc < 0 || fc > 7) continue;
      if (mine[fc] > 0) safety += 10; else safety -= 15;
      if (!mine[fc] && opp[fc]) safety -= 20;
    }

    // Penalise castled king on semi-open file in center
    if (kc >= 2 && kc <= 5) {
      const back = color === 'w' ? 7 : 0;
      if (kr !== back) safety -= 30;
    }
    return safety;
  }
}