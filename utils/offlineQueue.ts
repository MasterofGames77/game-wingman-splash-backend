/**
 * Offline Queue Utility
 * 
 * Manages queued actions for offline users that need to be synced when online.
 * Uses in-memory storage (can be extended to MongoDB for persistence).
 */

import { QueuedAction } from '../types';

class OfflineQueue {
  private queue: Map<string, QueuedAction> = new Map();
  private maxRetries = 3;
  private maxQueueSize = 1000; // Prevent memory issues

  /**
   * Generate a unique ID for a queued action
   */
  private generateId(): string {
    return `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a deduplication key based on action type and content
   */
  private generateDedupeKey(action: QueuedAction): string {
    // For waitlist signups, use email as dedupe key
    if (action.action === 'waitlist-signup' && action.body?.email) {
      return `waitlist-${action.body.email.toLowerCase().trim()}`;
    }

    // For forum posts, use userId + forumId + timestamp (within 5 seconds) as dedupe key
    if (action.action === 'forum-post' && action.body?.userId && action.body?.forumId) {
      const timeWindow = Math.floor(Date.parse(action.timestamp) / 5000); // 5 second window
      return `forum-post-${action.body.userId}-${action.body.forumId}-${timeWindow}`;
    }

    // Default: use action + endpoint + body hash
    const bodyStr = JSON.stringify(action.body);
    return `${action.action}-${action.endpoint}-${bodyStr}`;
  }

  /**
   * Add an action to the queue
   */
  addAction(
    action: string,
    endpoint: string,
    method: string,
    body: any,
    headers?: Record<string, string>,
    userId?: string
  ): QueuedAction {
    // Prevent queue overflow
    if (this.queue.size >= this.maxQueueSize) {
      // Remove oldest pending items
      const oldestPending = Array.from(this.queue.values())
        .filter(item => item.status === 'pending')
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
        .slice(0, 10); // Remove 10 oldest

      oldestPending.forEach(item => this.queue.delete(item.id));
    }

    const queuedAction: QueuedAction = {
      id: this.generateId(),
      action,
      endpoint,
      method,
      body,
      headers,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending',
      userId
    };

    // Check for duplicates
    const dedupeKey = this.generateDedupeKey(queuedAction);
    const existing = Array.from(this.queue.values()).find(
      item => this.generateDedupeKey(item) === dedupeKey && item.status === 'pending'
    );

    if (existing) {
      // Return existing action instead of creating duplicate
      return existing;
    }

    this.queue.set(queuedAction.id, queuedAction);
    return queuedAction;
  }

  /**
   * Get all pending actions
   */
  getPendingActions(): QueuedAction[] {
    return Array.from(this.queue.values())
      .filter(action => action.status === 'pending')
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  /**
   * Get actions by user ID
   */
  getActionsByUserId(userId: string): QueuedAction[] {
    return Array.from(this.queue.values())
      .filter(action => action.userId === userId)
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  /**
   * Get action by ID
   */
  getActionById(id: string): QueuedAction | undefined {
    return this.queue.get(id);
  }

  /**
   * Update action status
   */
  updateActionStatus(id: string, status: QueuedAction['status'], error?: string): boolean {
    const action = this.queue.get(id);
    if (!action) {
      return false;
    }

    // Enforce max retries when attempting to process
    if (status === 'processing') {
      if (action.retries >= this.maxRetries) {
        action.status = 'failed';
        action.error =
          error ?? action.error ?? `Max retries (${this.maxRetries}) exceeded`;
        this.queue.set(id, action);
        return false;
      }

      action.status = 'processing';
      action.retries += 1;
      if (error) {
        action.error = error;
      }
    } else if (status === 'failed') {
      // If there are retries remaining, keep it pending so it can be retried
      if (error) {
        action.error = error;
      }
      action.status = action.retries < this.maxRetries ? 'pending' : 'failed';
    } else {
      action.status = status;
      if (error) {
        action.error = error;
      }
    }

    this.queue.set(id, action);
    return true;
  }

  /**
   * Remove completed or failed actions (cleanup)
   */
  removeAction(id: string): boolean {
    return this.queue.delete(id);
  }

  /**
   * Clean up old completed/failed actions (older than 24 hours)
   */
  cleanup(): number {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [id, action] of this.queue.entries()) {
      if (
        (action.status === 'completed' || action.status === 'failed') &&
        Date.parse(action.timestamp) < oneDayAgo
      ) {
        this.queue.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const actions = Array.from(this.queue.values());
    return {
      total: actions.length,
      pending: actions.filter(a => a.status === 'pending').length,
      processing: actions.filter(a => a.status === 'processing').length,
      completed: actions.filter(a => a.status === 'completed').length,
      failed: actions.filter(a => a.status === 'failed').length,
      maxQueueSize: this.maxQueueSize
    };
  }

  /**
   * Clear all actions (for testing/reset)
   */
  clear(): void {
    this.queue.clear();
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    offlineQueue.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}

export type { QueuedAction };
