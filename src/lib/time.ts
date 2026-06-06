/**
 * Formats an ISO 8601 date string into a relative time representation.
 * E.g., "just now", "25s ago", "4m ago", "2h ago", "3d ago"
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Handle future dates or timezone skew
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    
    if (diffSecs < 10) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return '—';
  }
}

/**
 * Formats a date string to a full readable representation for tooltip hovers.
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch (e) {
    return '—';
  }
}
