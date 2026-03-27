export function getWorkingMinutes(startTimeIso, endTimeIso) {
  let current = new Date(startTimeIso);
  const endDate = new Date(endTimeIso);
  let minutes = 0;

  if (current >= endDate) return 0;

  while (current < endDate) {
    const day = current.getDay();

    // Skip weekends
    if (day === 0 || day === 6) {
      current.setDate(current.getDate() + (day === 0 ? 1 : 2));
      current.setHours(9, 0, 0, 0);
      continue;
    }

    // Before 9 AM -> Fast forward to 9 AM
    if (current.getHours() < 9) {
      current.setHours(9, 0, 0, 0);
      continue;
    }

    // After 5 PM -> Fast forward to 9 AM next day
    if (current.getHours() >= 17) {
      current.setDate(current.getDate() + 1);
      current.setHours(9, 0, 0, 0);
      continue;
    }

    const endOfDay = new Date(current);
    endOfDay.setHours(17, 0, 0, 0);

    const nextBoundary = new Date(
      Math.min(endDate.getTime(), endOfDay.getTime()),
    );
    minutes += (nextBoundary.getTime() - current.getTime()) / 60000;
    current = nextBoundary;
  }
  return minutes;
}

export function calculateRWT(events) {
  if (!events || events.length === 0) return { hours: 0, mins: 0 };

  let totalMinutes = 0;
  let lastOpenTime = null;
  const openStates = ["queued", "waiting on assignee"];

  events.forEach((ev) => {
    const toState = ev.to.toLowerCase();

    if (lastOpenTime) {
      totalMinutes += getWorkingMinutes(lastOpenTime, ev.timestamp);
      lastOpenTime = null;
    }

    if (openStates.includes(toState)) {
      lastOpenTime = ev.timestamp;
    }
  });

  // If currently still in an open state, calculate up to exactly right now
  if (lastOpenTime) {
    totalMinutes += getWorkingMinutes(lastOpenTime, new Date().toISOString());
  }

  return {
    hours: Math.floor(totalMinutes / 60),
    mins: Math.floor(totalMinutes % 60),
  };
}
