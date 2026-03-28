/**
 * Calculates working minutes bounded by 09:00 - 17:00, Mon-Fri.
 * @param {string} startTimeIso - ISO 8601 timestamp
 * @param {string} endTimeIso - ISO 8601 timestamp
 * @returns {number} Total valid business minutes
 */
export function getWorkingMinutes(startTimeIso, endTimeIso) {
  // To lock to a specific timezone (e.g., IST), you would apply the offset here.
  // Assuming local system time is acceptable for your current use case:
  let current = new Date(startTimeIso);
  const endDate = new Date(endTimeIso);
  let minutes = 0;

  if (current >= endDate) return 0;

  while (current < endDate) {
    const day = current.getDay();

    // 1. Skip weekends (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) {
      current.setDate(current.getDate() + (day === 0 ? 1 : 2));
      current.setHours(9, 0, 0, 0);
      continue;
    }

    // 2. Before 9 AM -> Fast forward to 9 AM today
    if (current.getHours() < 9) {
      current.setHours(9, 0, 0, 0);
      continue;
    }

    // 3. After 5 PM -> Fast forward to 9 AM tomorrow
    if (current.getHours() >= 17) {
      current.setDate(current.getDate() + 1);
      current.setHours(9, 0, 0, 0);
      continue;
    }

    // 4. Determine the next boundary (either 5 PM today, or the end time)
    const endOfDay = new Date(current);
    endOfDay.setHours(17, 0, 0, 0);

    const nextBoundary = new Date(
      Math.min(endDate.getTime(), endOfDay.getTime()),
    );

    // Accumulate the delta
    minutes += (nextBoundary.getTime() - current.getTime()) / 60000;

    // Move the cursor forward
    current = nextBoundary;
  }
  return minutes;
}

/**
 * Parses DevRev timeline events to extract total active RWT.
 * @param {Array} events - Array of telemetry objects { timestamp, from, to }
 * @returns {Object} { hours, mins }
 */
export function calculateRWT(events) {
  if (!events || !Array.isArray(events) || events.length === 0) {
    return { hours: 0, mins: 0 };
  }

  let totalMinutes = 0;
  let lastOpenTime = null;
  const openStates = ["queued", "waiting on assignee"];

  events.forEach((ev) => {
    const toState = ev.to.toLowerCase();
    const fromState = ev.from.toLowerCase();

    // Optimize: If transitioning between two open states, ignore the stop/start overhead
    if (openStates.includes(fromState) && openStates.includes(toState)) {
      // Do nothing, the timer remains running from the original lastOpenTime
      return;
    }

    if (lastOpenTime) {
      totalMinutes += getWorkingMinutes(lastOpenTime, ev.timestamp);
      lastOpenTime = null;
    }

    if (openStates.includes(toState)) {
      lastOpenTime = ev.timestamp;
    }
  });

  // Handle active "currently open" tickets
  if (lastOpenTime) {
    totalMinutes += getWorkingMinutes(lastOpenTime, new Date().toISOString());
  }

  return {
    hours: Math.floor(totalMinutes / 60),
    mins: Math.floor(totalMinutes % 60),
  };
}
