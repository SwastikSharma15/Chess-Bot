// Audio manager for chess game sounds
export class AudioManager {
  constructor() {
    this.sounds = {
      move: new Audio('/audio/move.mp3'),
      capture: new Audio('/audio/capture.mp3'),
      castle: new Audio('/audio/castle.mp3'),
      check: new Audio('/audio/check.mp3'),
      checkmate: new Audio('/audio/checkmate.mp3'),
      stalemate: new Audio('/audio/stalemate.mp3'),
      start: new Audio('/audio/start.mp3')
    };

    // Set volume for all sounds
    Object.values(this.sounds).forEach(audio => {
      audio.volume = 0.5;
    });
  }

  // Determine move type and play appropriate sound
  playMoveSound(moveData, gameState) {
    // Stop any currently playing sound
    this.stopAll();

    // Priority order for sounds
    if (gameState.isCheckmate) {
      this.play('checkmate');
    } else if (gameState.isStalemate) {
      this.play('stalemate');
    } else if (moveData.flags && moveData.flags.includes('k' || 'q')) {
      // Castling move (kingside or queenside)
      this.play('castle');
    } else if (moveData.captured) {
      // Capture move
      this.play('capture');
    } else if (gameState.isCheck) {
      // Check
      this.play('check');
    } else {
      // Regular move
      this.play('move');
    }
  }

  // Play start sound
  playStartSound() {
    this.stopAll();
    this.play('start');
  }

  // Play a specific sound
  play(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch(error => {
        console.log(`Could not play ${soundName} sound:`, error);
      });
    }
  }

  // Stop all sounds
  stopAll() {
    Object.values(this.sounds).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Set volume (0-1)
  setVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(audio => {
      audio.volume = clampedVolume;
    });
  }
}
