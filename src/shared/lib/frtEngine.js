/**
 * Calculates First Response Time (FRT) in chronological hours and minutes.
 * @param {string} ticketCreatedAt - ISO 8601 timestamp
 * @param {string} firstResponseAt - ISO 8601 timestamp
 * @returns {Object|null} { hours, mins } or null if pending
 */
export function calculateFRT(ticketCreatedAt, firstResponseAt) {
  if (!ticketCreatedAt || !firstResponseAt) return null;

  const start = new Date(ticketCreatedAt).getTime();
  const end = new Date(firstResponseAt).getTime();

  if (isNaN(start) || isNaN(end)) return null;

  const diffMs = end - start;

  // Sanity check just in case timestamps are inverted
  if (diffMs < 0) return { hours: 0, mins: 0 };

  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  return { hours, mins };
}
/**
 * Calculates First Response Resolution (FRR) using a Live Agent Effort rule.
 * FRR is "Yes" if there is exactly ONE agent reply, regardless of ticket stage.
 * @param {Array} events - The stage transition events array (kept for signature compatibility)
 * @param {Array} agentReplyTimestamps - Array of ISO 8601 timestamps of agent replies
 * @returns {string} "Yes", "No", or "Pending"
 */
export function calculateFRR(events, agentReplyTimestamps = []) {
  // 1. If no agent has replied yet, the metric is Pending.
  if (!agentReplyTimestamps || agentReplyTimestamps.length === 0) {
    return "Pending";
  }

  // 2. The Live "Agent Effort" Rule: Exactly ONE reply means FRR is intact ("Yes").
  if (agentReplyTimestamps.length === 1) {
    return "Yes";
  }

  // 3. The moment the agent has to reply 2 or more times, FRR is lost ("No").
  return "No";
}
