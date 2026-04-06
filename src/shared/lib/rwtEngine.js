// offsetMins: IST is +330 mins (+5:30), CST is -360 mins (-06:00)
const SLA_SCHEDULES = {
  // --- NAM ALIASES ---
  "NORTH AMERICA": {
    startHour: 9,
    startMin: 30,
    endHour: 18,
    endMin: 30,
    offsetMins: -360,
  },
  "NAM (US)": {
    startHour: 9,
    startMin: 30,
    endHour: 18,
    endMin: 30,
    offsetMins: -360,
  },
  NAM: {
    startHour: 9,
    startMin: 30,
    endHour: 18,
    endMin: 30,
    offsetMins: -360,
  },

  // --- LATAM ALIASES ---
  LATAM: {
    startHour: 9,
    startMin: 30,
    endHour: 18,
    endMin: 30,
    offsetMins: -360,
  },

  // --- IST ALIASES ---
  MEA: {
    startHour: 10,
    startMin: 30,
    endHour: 18,
    endMin: 30,
    offsetMins: 330,
  },
  SEA: { startHour: 6, startMin: 30, endHour: 15, endMin: 30, offsetMins: 330 },
  APAC: {
    startHour: 6,
    startMin: 30,
    endHour: 15,
    endMin: 30,
    offsetMins: 330,
  },

  "EU Business hours": {
    startHour: 13,
    startMin: 30,
    endHour: 22,
    endMin: 30,
    offsetMins: 330,
  },
  EU: { startHour: 13, startMin: 30, endHour: 22, endMin: 30, offsetMins: 330 },

  India: {
    startHour: 9,
    startMin: 30,
    endHour: 17,
    endMin: 30,
    offsetMins: 330,
  },
  DEFAULT: {
    startHour: 9,
    startMin: 30,
    endHour: 17,
    endMin: 30,
    offsetMins: 330,
  },
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
 * Uses Timezone Shifting to handle local weekends safely.
 */
export function getWorkingMinutes(startTimeIso, endTimeIso, schedule) {
  // Convert offset to milliseconds
  const offsetMs = schedule.offsetMins * 60000;

  // Shift absolute UTC time into "Local-as-UTC" space
  let currentMs = new Date(startTimeIso).getTime() + offsetMs;
  const endMs = new Date(endTimeIso).getTime() + offsetMs;
  let minutes = 0;

  if (currentMs >= endMs) return 0;

  while (currentMs < endMs) {
    const currentLocal = new Date(currentMs);
    // Because we shifted the time, getUTCDay() accurately reflects the local day!
    const day = currentLocal.getUTCDay();

    // 1. Skip weekends (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) {
      currentLocal.setUTCDate(currentLocal.getUTCDate() + (day === 0 ? 1 : 2));
      currentLocal.setUTCHours(schedule.startHour, schedule.startMin, 0, 0);
      currentMs = currentLocal.getTime();
      continue;
    }

    // 2. Before Start Time -> Fast forward to exactly Start Time today
    const startOfDay = new Date(currentMs);
    startOfDay.setUTCHours(schedule.startHour, schedule.startMin, 0, 0);

    if (currentMs < startOfDay.getTime()) {
      currentMs = startOfDay.getTime();
      continue;
    }

    // 3. After End Time -> Fast forward to Start Time tomorrow
    const endOfDay = new Date(currentMs);
    endOfDay.setUTCHours(schedule.endHour, schedule.endMin, 0, 0);

    if (currentMs >= endOfDay.getTime()) {
      currentLocal.setUTCDate(currentLocal.getUTCDate() + 1);
      currentLocal.setUTCHours(schedule.startHour, schedule.startMin, 0, 0);
      currentMs = currentLocal.getTime();
      continue;
    }

    // 4. Determine the next boundary and accumulate the delta
    const nextBoundaryMs = Math.min(endMs, endOfDay.getTime());

    // Because delta is (TimeB - TimeA), the offsetMs cancels out, giving true elapsed minutes
    minutes += (nextBoundaryMs - currentMs) / 60000;

    currentMs = nextBoundaryMs;
  }

  return minutes;
}

/**
 * Parses DevRev timeline events to extract total active RWT based on Region.
 */
export function calculateRWT(events, ticketCreatedAt, regionName = "DEFAULT") {
  const schedule = getScheduleForRegion(regionName);

  if (!events || !Array.isArray(events) || events.length === 0) {
    if (!ticketCreatedAt) return { hours: 0, mins: 0 };

    const totalMinutes = getWorkingMinutes(
      ticketCreatedAt,
      new Date().toISOString(),
      schedule,
    );
    return {
      hours: Math.floor(totalMinutes / 60),
      mins: Math.floor(totalMinutes % 60),
    };
  }

  const openStates = ["queued", "waiting on assignee", "waiting on clevertap"];
  let totalMinutes = 0;
  let lastOpenTime = ticketCreatedAt;

  events.forEach((ev) => {
    const toState = ev.to.toLowerCase();

    if (openStates.includes(toState)) {
      if (!lastOpenTime) {
        lastOpenTime = ev.timestamp;
      }
    } else {
      if (lastOpenTime) {
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
