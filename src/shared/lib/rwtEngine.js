// src/shared/lib/rwtEngine.js

// 1. STRICT REGIONAL SLA SCHEDULES (All times mapped to IST)
const SLA_SCHEDULES = {
  "NAM (US)": { startHour: 7, startMin: 30, endHour: 17, endMin: 30 },
  NAM: { startHour: 7, startMin: 30, endHour: 17, endMin: 30 },
  MEA: { startHour: 10, startMin: 30, endHour: 18, endMin: 30 },
  LATAM: { startHour: 7, startMin: 30, endHour: 17, endMin: 30 },
  SEA: { startHour: 6, startMin: 30, endHour: 15, endMin: 30 },
  APAC: { startHour: 6, startMin: 30, endHour: 15, endMin: 30 },
  "EU Business hours": { startHour: 13, startMin: 30, endHour: 22, endMin: 30 },
  EU: { startHour: 13, startMin: 30, endHour: 22, endMin: 30 },
  India: { startHour: 9, startMin: 30, endHour: 17, endMin: 30 },
  DEFAULT: { startHour: 9, startMin: 30, endHour: 17, endMin: 30 }, // Safe fallback
};

/**
 * Safely extracts the correct schedule object, falling back to DEFAULT if missing.
 */
function getScheduleForRegion(regionName) {
  if (!regionName) return SLA_SCHEDULES["DEFAULT"];

  if (SLA_SCHEDULES[regionName]) return SLA_SCHEDULES[regionName];

  const upperRegion = regionName.toUpperCase();
  for (const key of Object.keys(SLA_SCHEDULES)) {
    if (upperRegion.includes(key.toUpperCase()) && key !== "DEFAULT") {
      return SLA_SCHEDULES[key];
    }
  }

  return SLA_SCHEDULES["DEFAULT"];
}

/**
 * Calculates working minutes bounded dynamically by the SLA schedule.
 * @param {string} startTimeIso - ISO 8601 timestamp
 * @param {string} endTimeIso - ISO 8601 timestamp
 * @param {Object} schedule - { startHour, startMin, endHour, endMin }
 * @returns {number} Total valid business minutes
 */
export function getWorkingMinutes(startTimeIso, endTimeIso, schedule) {
  let current = new Date(startTimeIso);
  const endDate = new Date(endTimeIso);
  let minutes = 0;

  if (current >= endDate) return 0;

  while (current < endDate) {
    const day = current.getDay();

    // 1. Skip weekends (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) {
      current.setDate(current.getDate() + (day === 0 ? 1 : 2));
      current.setHours(schedule.startHour, schedule.startMin, 0, 0);
      continue;
    }

    // 2. Before Start Time -> Fast forward to exactly Start Time today
    const startOfDay = new Date(current);
    startOfDay.setHours(schedule.startHour, schedule.startMin, 0, 0);

    if (current < startOfDay) {
      current = startOfDay;
      continue;
    }

    // 3. After End Time -> Fast forward to Start Time tomorrow
    const endOfDay = new Date(current);
    endOfDay.setHours(schedule.endHour, schedule.endMin, 0, 0);

    if (current >= endOfDay) {
      current.setDate(current.getDate() + 1);
      current.setHours(schedule.startHour, schedule.startMin, 0, 0);
      continue;
    }

    // 4. Determine the next boundary (either the end of this shift, or the actual end time)
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
 * Parses DevRev timeline events to extract total active RWT based on Region.
 * @param {Array} events - Array of telemetry objects { timestamp, from, to }
 * @param {string} regionName - The SLA Region string from the ticket metadata
 * @returns {Object} { hours, mins }
 */
export function calculateRWT(events, regionName = "DEFAULT") {
  if (!events || !Array.isArray(events) || events.length === 0) {
    return { hours: 0, mins: 0 };
  }

  // Inject the dynamic schedule
  const schedule = getScheduleForRegion(regionName);

  let totalMinutes = 0;
  let lastOpenTime = null;
  const openStates = ["queued", "waiting on assignee"];

  events.forEach((ev) => {
    const toState = ev.to.toLowerCase();

    if (openStates.includes(toState)) {
      if (!lastOpenTime) {
        lastOpenTime = ev.timestamp;
      }
    } else {
      if (lastOpenTime) {
        // Pass the schedule down to the math engine
        totalMinutes += getWorkingMinutes(lastOpenTime, ev.timestamp, schedule);
        lastOpenTime = null;
      }
    }
  });

  if (lastOpenTime) {
    totalMinutes += getWorkingMinutes(
      lastOpenTime,
      new Date().toISOString(),
      schedule,
    );
  }

  return {
    hours: Math.floor(totalMinutes / 60),
    mins: Math.floor(totalMinutes % 60),
  };
}
