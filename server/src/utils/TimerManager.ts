import PollService from '../services/PollService';

interface TimerState {
  pollId: string;
  startTime: number;
  duration: number;
  timeoutId?: NodeJS.Timeout;
}

class TimerManager {
  private activeTimers: Map<string, TimerState> = new Map();

  startTimer(pollId: string, duration: number, onExpire?: () => void): void {
    this.clearTimer(pollId);

    const startTime = Date.now();
    
    const timeoutId = setTimeout(async () => {
      console.log(`Timer expired for poll: ${pollId}`);
      
      try {
        await PollService.completePoll(pollId);
        
        if (onExpire) {
          onExpire();
        }
      } catch (error) {
        console.error('Error completing poll on timer expiry:', error);
      }

      this.activeTimers.delete(pollId);
    }, duration * 1000);

    this.activeTimers.set(pollId, {
      pollId,
      startTime,
      duration,
      timeoutId
    });

    console.log(`Timer started for poll ${pollId}: ${duration}s`);
  }

  getRemainingTime(pollId: string): number {
    const timer = this.activeTimers.get(pollId);

    if (!timer) {
      return 0;
    }

    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    const remaining = timer.duration - elapsed;

    return remaining > 0 ? remaining : 0;
  }


  isExpired(pollId: string): boolean {
    return this.getRemainingTime(pollId) === 0;
  }


  clearTimer(pollId: string): void {
    const timer = this.activeTimers.get(pollId);

    if (timer && timer.timeoutId) {
      clearTimeout(timer.timeoutId);
      this.activeTimers.delete(pollId);
      console.log(`Timer cleared for poll: ${pollId}`);
    }
  }


  clearAllTimers(): void {
    this.activeTimers.forEach((timer) => {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId);
      }
    });

    this.activeTimers.clear();
    console.log('All timers cleared');
  }


  getActiveTimers(): string[] {
    return Array.from(this.activeTimers.keys());
  }

  getTimerState(pollId: string): TimerState | undefined {
    return this.activeTimers.get(pollId);
  }
}

export default new TimerManager();