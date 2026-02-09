const GameControls = ({ 
  gameStatus, 
  currentPlayer, 
  onNewGame, 
  onUndo,
  moveHistory,
  isThinking 
}) => {
  const getStatusMessage = () => {
    if (isThinking) return "AI is calculating...";
    
    switch (gameStatus) {
      case 'checkmate':
        return currentPlayer === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
      case 'stalemate':
        return 'Game ended in stalemate!';
      case 'draw':
        return 'Game ended in a draw!';
      case 'check':
        return `${currentPlayer === 'w' ? 'White' : 'Black'} is in check!`;
      default:
        return `${currentPlayer === 'w' ? 'White' : 'Black'} to move`;
    }
  };

  const getStatusColor = () => {
    if (gameStatus === 'checkmate') return 'text-red-600';
    if (gameStatus === 'check') return 'text-orange-600';
    if (gameStatus === 'stalemate' || gameStatus === 'draw') return 'text-gray-600';
    if (isThinking) return 'text-blue-600';
    return 'text-gray-800';
  };

  const formatMoveHistory = () => {
    const moves = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1];
      moves.push({ moveNumber, whiteMove, blackMove });
    }
    return moves;
  };

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Game Status</h3>
        <p className={`text-lg font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </p>
        {isThinking && (
          <div className="mt-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Thinking...</span>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Controls</h3>
        <div className="space-y-3">
          <button
            onClick={onNewGame}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            New Game
          </button>
          <button
            onClick={onUndo}
            disabled={moveHistory.length < 2 || isThinking}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Undo Move
          </button>
        </div>
      </div>

      {/* Move History */}
      {moveHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Move History</h3>
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {formatMoveHistory().map((move, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="w-8 text-gray-500 font-mono">{move.moveNumber}.</span>
                  <span className="w-16 font-mono text-gray-800">{move.whiteMove}</span>
                  {move.blackMove && (
                    <span className="w-16 font-mono text-gray-800">{move.blackMove}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Info */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Engine</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Minimax with Alpha-Beta Pruning</p>
          <p>• Depth 4 search</p>
          <p>• Transposition table</p>
          <p>• Advanced position evaluation</p>
        </div>
      </div>
    </div>
  );
};

export default GameControls;