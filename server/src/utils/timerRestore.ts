import Poll from '../models/Poll';
import TimerManager from './TimerManager';

/**
 * Restore active poll timers after server restart
 * This ensures polls that were running before server restart continue properly
 */
export async function restoreActiveTimers(socketController: any): Promise<void> {
  try {
    const activePolls = await Poll.find({ status: 'active' });
    
    if (activePolls.length === 0) {
      console.log('No active polls to restore');
      return;
    }

    console.log(`Found ${activePolls.length} active poll(s), restoring timers...`);

    for (const poll of activePolls) {
      const remainingTime = poll.getRemainingTime();
      
      if (remainingTime > 0) {
        // Poll is still active, restore the timer
        TimerManager.startTimer(
          poll._id.toString(),
          remainingTime,
          () => {
            // When timer expires, notify via socket controller
            if (socketController && socketController.handlePollExpired) {
              socketController.handlePollExpired(poll._id.toString());
            }
          }
        );
        
        console.log(`✓ Restored timer for poll ${poll._id}: ${remainingTime}s remaining`);
      } else {
        // Poll has already expired, mark it as completed
        poll.status = 'completed';
        await poll.save();
        
        console.log(`✓ Marked expired poll ${poll._id} as completed`);
      }
    }

    console.log('Timer restoration complete');
  } catch (error) {
    console.error('Error restoring timers:', error);
    // Don't throw - server should still start even if timer restoration fails
  }
}
