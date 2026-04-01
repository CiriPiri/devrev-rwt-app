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
 * Calculates First Response Resolution (FRR) using the "Agent Effort" rule.
 * FRR is "Yes" if the ticket is solved requiring exactly ONE agent reply.
 * @param {Array} events - The stage transition events array
 * @param {Array} agentReplyTimestamps - Array of ISO 8601 timestamps of agent replies
 * @returns {string} "Yes", "No", or "Pending"
 */
export function calculateFRR(events, agentReplyTimestamps = []) {
  if (!events || events.length === 0) return "Pending";

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );
  const finalState = sortedEvents[sortedEvents.length - 1].to.toLowerCase();

  const isResolved =
    finalState === "solved" ||
    finalState === "closed" ||
    finalState === "resolved";

  // 1. If not closed yet, it's pending.
  if (!isResolved) return "Pending";

  // 2. If it was solved without an agent ever replying (Silent Solve).
  if (agentReplyTimestamps.length === 0) return "No";

  // 3. The "Agent Effort" Rule: If the agent replied exactly ONCE, it is FRR Yes!
  if (agentReplyTimestamps.length === 1) return "Yes";

  // 4. If the agent had to reply 2 or more times, it is FRR No.
  return "No";
}
