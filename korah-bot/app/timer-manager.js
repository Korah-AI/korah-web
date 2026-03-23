/**
 * Korah Timer Manager - Global persistent timer
 * Persists timer state across page navigation using localStorage
 * with timestamp-based tracking for accurate remaining time.
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'korah_timer_state';
  const UPDATE_INTERVAL = 1000; // Update every second

  // Timer state structure:
  // {
  //   isRunning: boolean,
  //   endTime: number | null,  // Unix timestamp when timer should end
  //   totalSeconds: number,    // Original duration in seconds
  //   preset: number,          // Preset minutes (5, 10, 25, etc.)
  //   startedAt: number | null // When timer was started (for progress calculation)
  // }

  class KorahTimer {
    constructor() {
      this._intervalId = null;
      this._listeners = [];
      this._initialized = false;
    }

    /**
     * Initialize the timer manager
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;

      // Load saved state and start update loop if running
      const state = this.getState();
      if (state.isRunning) {
        this._startUpdateLoop();
        
        // Check if timer already completed while away
        const remaining = this.getRemainingSeconds();
        if (remaining <= 0) {
          this.complete();
        }
      }

      // Listen for storage changes (multi-tab sync)
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this._notifyListeners();
        }
      });
    }

    /**
     * Get current timer state from localStorage
     */
    getState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error('[Timer] Error loading state:', e);
      }
      
      return {
        isRunning: false,
        endTime: null,
        totalSeconds: 25 * 60,
        preset: 25,
        startedAt: null
      };
    }

    /**
     * Save timer state to localStorage
     */
    _saveState(state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        this._notifyListeners();
      } catch (e) {
        console.error('[Timer] Error saving state:', e);
      }
    }

    /**
     * Start a timer with the given preset (in minutes)
     */
    start(presetMinutes) {
      const totalSeconds = presetMinutes * 60;
      const now = Date.now();
      
      const state = {
        isRunning: true,
        endTime: now + (totalSeconds * 1000),
        totalSeconds: totalSeconds,
        preset: presetMinutes,
        startedAt: now
      };
      
      this._saveState(state);
      this._startUpdateLoop();
    }

    /**
     * Pause the current timer
     */
    pause() {
      const state = this.getState();
      if (!state.isRunning) return;

      // Calculate remaining time and store it
      const remaining = this.getRemainingSeconds();
      
      const newState = {
        ...state,
        isRunning: false,
        endTime: null,
        totalSeconds: Math.max(remaining, 0),
        startedAt: null
      };
      
      this._saveState(newState);
      this._stopUpdateLoop();
    }

    /**
     * Resume a paused timer
     */
    resume() {
      const state = this.getState();
      if (state.isRunning || state.totalSeconds <= 0) return;

      const now = Date.now();
      const newState = {
        ...state,
        isRunning: true,
        endTime: now + (state.totalSeconds * 1000),
        startedAt: now
      };
      
      this._saveState(newState);
      this._startUpdateLoop();
    }

    /**
     * Toggle between start/pause/resume
     */
    toggle() {
      const state = this.getState();
      
      if (state.isRunning) {
        this.pause();
      } else if (state.totalSeconds > 0) {
        // If we have a preset but no time left, start fresh
        if (state.totalSeconds <= 0 && state.preset) {
          this.start(state.preset);
        } else {
          this.resume();
        }
      } else {
        // Start with default preset
        this.start(state.preset || 25);
      }
    }

    /**
     * Reset the timer to a specific preset
     */
    reset(presetMinutes) {
      const state = this.getState();
      
      const newState = {
        isRunning: false,
        endTime: null,
        totalSeconds: presetMinutes * 60,
        preset: presetMinutes,
        startedAt: null
      };
      
      this._saveState(newState);
      this._stopUpdateLoop();
    }

    /**
     * Set a new preset and reset timer
     */
    setPreset(presetMinutes) {
      this.reset(presetMinutes);
    }

    /**
     * Get remaining seconds
     */
    getRemainingSeconds() {
      const state = this.getState();
      
      if (!state.isRunning || !state.endTime) {
        return state.totalSeconds;
      }
      
      const remaining = Math.ceil((state.endTime - Date.now()) / 1000);
      return Math.max(remaining, 0);
    }

    /**
     * Get progress percentage (0-100)
     */
    getProgress() {
      const state = this.getState();
      const remaining = this.getRemainingSeconds();
      
      if (state.totalSeconds <= 0) return 0;
      
      const elapsed = state.totalSeconds - remaining;
      return Math.min(100, Math.max(0, (elapsed / state.totalSeconds) * 100));
    }

    /**
     * Format seconds as MM:SS
     */
    formatTime(seconds) {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    /**
     * Complete the timer
     */
    complete() {
      const state = this.getState();
      
      const newState = {
        ...state,
        isRunning: false,
        endTime: null,
        totalSeconds: 0,
        startedAt: null
      };
      
      this._saveState(newState);
      this._stopUpdateLoop();
      
      // Notify listeners
      this._notifyListeners('complete');
      
      // Show alert
      alert('Timer completed! Take a break.');
    }

    /**
     * Start the update loop
     */
    _startUpdateLoop() {
      if (this._intervalId) return;
      
      this._intervalId = setInterval(() => {
        const remaining = this.getRemainingSeconds();
        
        // Check for completion
        if (remaining <= 0) {
          this.complete();
          return;
        }
        
        // Notify listeners of update
        this._notifyListeners('update');
      }, UPDATE_INTERVAL);
    }

    /**
     * Stop the update loop
     */
    _stopUpdateLoop() {
      if (this._intervalId) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
    }

    /**
     * Add a listener for timer events
     * @param {function} callback - Called with (eventType, state)
     */
    addListener(callback) {
      this._listeners.push(callback);
      return () => {
        this._listeners = this._listeners.filter(l => l !== callback);
      };
    }

    /**
     * Notify all listeners
     */
    _notifyListeners(eventType = 'update') {
      const state = this.getState();
      this._listeners.forEach(callback => {
        try {
          callback(eventType, state);
        } catch (e) {
          console.error('[Timer] Listener error:', e);
        }
      });
    }
  }

  // Create global instance
  window.KorahTimer = new KorahTimer();

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.KorahTimer.init());
  } else {
    window.KorahTimer.init();
  }
})();
