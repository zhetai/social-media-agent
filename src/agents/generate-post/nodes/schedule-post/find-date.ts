import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  isValid,
  addDays,
  isSaturday,
  isSunday,
  isFriday,
  isMonday,
  addMinutes,
} from "date-fns";
import { DateType } from "../../../types.js";

export function validateAfterSeconds(afterSeconds: number) {
  // If after seconds is negative, throw an error
  if (afterSeconds < 0) {
    throw new Error(
      `Schedule date must be in the future. Instead, received: ${afterSeconds} seconds.`,
    );
  }
}

export const ALLOWED_P1_DAY_AND_TIMES_IN_UTC = [
  // Sunday 16:00 UTC (8AM PST)
  {
    day: 0,
    hour: 16,
  },
  // Sunday 17:00 UTC (9AM PST)
  {
    day: 0,
    hour: 17,
  },
  // Sunday 18:00 UTC (10AM PST)
  {
    day: 0,
    hour: 18,
  },
  // Saturday 16:00 UTC (8AM PST)
  {
    day: 6,
    hour: 16,
  },
  // Saturday 17:00 UTC (9AM PST)
  {
    day: 6,
    hour: 17,
  },
  // Saturday 18:00 UTC (10AM PST)
  {
    day: 6,
    hour: 18,
  },
];

export const ALLOWED_P2_DAY_AND_TIMES_IN_UTC = [
  // Monday 16:00 UTC (8AM PST)
  {
    day: 1,
    hour: 16,
  },
  // Monday 17:00 UTC (9AM PST)
  {
    day: 1,
    hour: 17,
  },
  // Monday 18:00 UTC (10AM PST)
  {
    day: 1,
    hour: 18,
  },
  // Friday 16:00 UTC (8AM PST)
  {
    day: 5,
    hour: 16,
  },
  // Friday 17:00 UTC (9AM PST)
  {
    day: 5,
    hour: 17,
  },
  // Friday 18:00 UTC (10AM PST)
  {
    day: 5,
    hour: 18,
  },
  // Sunday 19:00 UTC (11AM PST)
  {
    day: 0,
    hour: 19,
  },
  // Sunday 20:00 UTC (12PM PST)
  {
    day: 0,
    hour: 20,
  },
  // Sunday 21:00 UTC (1PM PST)
  {
    day: 0,
    hour: 21,
  },
  // Saturday 19:00 UTC (11AM PST)
  {
    day: 6,
    hour: 19,
  },
  // Saturday 20:00 UTC (12PM PST)
  {
    day: 6,
    hour: 20,
  },
  // Saturday 21:00 UTC (1PM PST)
  {
    day: 6,
    hour: 21,
  },
];

export const ALLOWED_P3_DAY_AND_TIMES_IN_UTC = [
  // Sunday 21:00 UTC (1PM PST)
  {
    day: 0,
    hour: 21,
  },
  // Sunday 22:00 UTC (2PM PST)
  {
    day: 0,
    hour: 22,
  },
  // Sunday 23:00 UTC (3PM PST)
  {
    day: 0,
    hour: 23,
  },
  // Monday 00:00 UTC (4PM PST Sunday)
  {
    day: 1,
    hour: 0,
  },
  // Monday 01:00 UTC (5PM PST Sunday)
  {
    day: 1,
    hour: 1,
  },
  // Saturday 21:00 UTC (1PM PST)
  {
    day: 6,
    hour: 21,
  },
  // Saturday 22:00 UTC (2PM PST)
  {
    day: 6,
    hour: 22,
  },
  // Saturday 23:00 UTC (3PM PST)
  {
    day: 6,
    hour: 23,
  },
  // Sunday 00:00 UTC (4PM PST Saturday)
  {
    day: 0,
    hour: 0,
  },
  // Sunday 01:00 UTC (5PM PST Saturday)
  {
    day: 0,
    hour: 1,
  },
];

type TakenScheduleDates = {
  p1: Date[];
  p2: Date[];
  p3: Date[];
};

const DEFAULT_TAKEN_DATES: TakenScheduleDates = {
  p1: [],
  p2: [],
  p3: [],
};

const NAMESPACE = ["taken_schedule_dates"];
const KEY = "dates";
const TAKEN_DATES_KEY = "taken_dates";

/**
 * Searches the store for all taken schedule dates
 * @param config
 * @returns {Promise<TakenScheduleDates>} The taken schedule dates, or DEFAULT_TAKEN_DATES if no dates are taken
 */
export async function getTakenScheduleDates(
  config: LangGraphRunnableConfig,
): Promise<TakenScheduleDates> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  const takenDates = await store.get(NAMESPACE, KEY);
  if (!takenDates) {
    return DEFAULT_TAKEN_DATES;
  }
  const storedDates = takenDates.value?.[TAKEN_DATES_KEY];
  // Convert stored string dates back to Date objects
  return {
    p1: storedDates?.p1?.map((d: string) => new Date(d)) || [],
    p2: storedDates?.p2?.map((d: string) => new Date(d)) || [],
    p3: storedDates?.p3?.map((d: string) => new Date(d)) || [],
  };
}

/**
 * Updates the store with a new taken scheduled date
 * @param {TakenScheduleDates} takenDates The new taken schedule dates
 * @param {LangGraphRunnableConfig} config
 * @returns {Promise<void>}
 */
export async function putTakenScheduleDates(
  takenDates: TakenScheduleDates,
  config: LangGraphRunnableConfig,
): Promise<void> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  // Convert Date objects to ISO strings for storage
  const serializedDates = {
    p1: takenDates.p1.map((d) => d.toISOString()),
    p2: takenDates.p2.map((d) => d.toISOString()),
    p3: takenDates.p3.map((d) => d.toISOString()),
  };
  await store.put(NAMESPACE, KEY, {
    [TAKEN_DATES_KEY]: serializedDates,
  });
}

function getAfterSeconds(date: Date, baseDate: Date = new Date()): number {
  return Math.floor((date.getTime() - baseDate.getTime()) / 1000);
}

export function isDateTaken(
  date: Date,
  takenDates: TakenScheduleDates | undefined,
  priority: "p1" | "p2" | "p3",
): boolean {
  if (!takenDates) return false;
  const hour = date.getUTCHours();
  const day = date.getUTCDay();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();

  // Only check dates within the same priority level
  const priorityDates = takenDates[priority];
  return priorityDates.some((takenDate) => {
    return (
      hour === takenDate.getUTCHours() &&
      day === takenDate.getUTCDay() &&
      month === takenDate.getUTCMonth() &&
      year === takenDate.getUTCFullYear()
    );
  });
}

function getNextValidDay(
  currentDate: Date,
  priority: "p1" | "p2" | "p3",
): Date {
  const currentHour = currentDate.getUTCHours();
  const currentMinutes = currentDate.getUTCMinutes();

  // For the current day, check if we've passed the time window
  const isPastTimeWindow = (day: Date): boolean => {
    const { end } = getTimeRangeForPriority(day, priority);
    return (
      currentHour > end.getUTCHours() ||
      (currentHour === end.getUTCHours() &&
        currentMinutes >= end.getUTCMinutes())
    );
  };

  // For P2, first try to find a valid weekday (Friday or Monday)
  if (priority === "p2") {
    for (let i = 0; i < 7; i += 1) {
      const candidateDate = addDays(currentDate, i);
      if (isFriday(candidateDate) || isMonday(candidateDate)) {
        if (i === 0 && isPastTimeWindow(candidateDate)) {
          continue;
        }
        return candidateDate;
      }
    }
  }

  // For P1 and P3, find the next weekend day
  const isWeekendPriority = priority === "p1" || priority === "p3";
  if (isWeekendPriority) {
    for (let i = 0; i < 7; i += 1) {
      const candidateDate = addDays(currentDate, i);
      if (isSaturday(candidateDate) || isSunday(candidateDate)) {
        if (i === 0 && isPastTimeWindow(candidateDate)) {
          continue;
        }
        return candidateDate;
      }
    }
  }

  // For P2, if no weekday was found, try weekend
  for (let i = 0; i < 7; i += 1) {
    const candidateDate = addDays(currentDate, i);
    if (isSaturday(candidateDate) || isSunday(candidateDate)) {
      if (i === 0 && isPastTimeWindow(candidateDate)) {
        continue;
      }
      return candidateDate;
    }
  }

  // If no valid day found in the next week, return the last checked date
  return addDays(currentDate, 6);
}

function getTimeRangeForPriority(
  date: Date,
  priority: "p1" | "p2" | "p3",
): { start: Date; end: Date } {
  const allowedTimes =
    priority === "p1"
      ? ALLOWED_P1_DAY_AND_TIMES_IN_UTC
      : priority === "p2"
        ? ALLOWED_P2_DAY_AND_TIMES_IN_UTC
        : ALLOWED_P3_DAY_AND_TIMES_IN_UTC;

  const dayTimes = allowedTimes.filter((time) => time.day === date.getUTCDay());

  if (dayTimes.length === 0) {
    throw new Error(
      `No allowed times found for day ${date.getUTCDay()} and priority ${priority}`,
    );
  }

  const startHour = Math.min(...dayTimes.map((t) => t.hour));
  const endHour = Math.max(...dayTimes.map((t) => t.hour));

  return {
    start: new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        startHour,
        0,
        0,
      ),
    ),
    end: new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        endHour,
        0,
        0,
      ),
    ),
  };
}

function validateScheduleDate(date: Date, baseDate: Date): void {
  const afterSeconds = getAfterSeconds(date, baseDate);
  if (afterSeconds <= 0) {
    throw new Error(
      `Schedule date must be in the future. Instead, received: ${date.toISOString()}`,
    );
  }
}

const MAX_WEEKS_AHEAD = 52; // Maximum weeks to look ahead (1 year)
const MAX_DAYS_AHEAD = 365; // Maximum days to look ahead (1 year)

export async function getScheduledDateSeconds(
  scheduleDate: DateType,
  config: LangGraphRunnableConfig,
  baseDate: Date = new Date(),
): Promise<number> {
  if (isValid(scheduleDate)) {
    const afterSeconds = getAfterSeconds(scheduleDate as Date, baseDate);
    validateAfterSeconds(afterSeconds);
    return afterSeconds;
  }

  const priority = scheduleDate as "p1" | "p2" | "p3";
  if (!["p1", "p2", "p3"].includes(priority)) {
    throw new Error(
      `Invalid priority level. Expected p1, p2, or p3, but received: ${priority}`,
    );
  }

  const takenScheduleDates = await getTakenScheduleDates(config);

  // For P1 and P3, look for available weekend slots within the next 52 weeks
  if (priority === "p1" || priority === "p3") {
    let weekOffset = 0;
    while (weekOffset < MAX_WEEKS_AHEAD) {
      const candidateDate = addDays(baseDate, weekOffset * 7);
      const nextWeekendDay = getNextValidDay(candidateDate, priority);
      const { start, end } = getTimeRangeForPriority(nextWeekendDay, priority);

      let currentTime = start;
      while (currentTime <= end) {
        if (!isDateTaken(currentTime, takenScheduleDates, priority)) {
          validateScheduleDate(currentTime, baseDate);
          takenScheduleDates[priority].push(currentTime);
          await putTakenScheduleDates(takenScheduleDates, config);
          return getAfterSeconds(currentTime, baseDate);
        }
        currentTime = addMinutes(currentTime, 60);
      }

      // If Saturday slots are full, try Sunday
      if (isSaturday(nextWeekendDay)) {
        const nextDay = addDays(nextWeekendDay, 1);
        const { start, end } = getTimeRangeForPriority(nextDay, priority);

        let currentTime = start;
        while (currentTime <= end) {
          if (!isDateTaken(currentTime, takenScheduleDates, priority)) {
            validateScheduleDate(currentTime, baseDate);
            takenScheduleDates[priority].push(currentTime);
            await putTakenScheduleDates(takenScheduleDates, config);
            return getAfterSeconds(currentTime, baseDate);
          }
          currentTime = addMinutes(currentTime, 60);
        }
      }
      weekOffset++;
    }

    throw new Error("No available schedule date found");
  }

  // For P2, try until we find an available slot within the next 365 days
  let dayOffset = 0;
  while (dayOffset < MAX_DAYS_AHEAD) {
    const candidateDate = addDays(baseDate, dayOffset);
    const nextValidDay = getNextValidDay(candidateDate, priority);
    const { start, end } = getTimeRangeForPriority(nextValidDay, priority);

    let currentTime = start;
    while (currentTime <= end) {
      if (!isDateTaken(currentTime, takenScheduleDates, priority)) {
        validateScheduleDate(currentTime, baseDate);
        takenScheduleDates[priority].push(currentTime);
        await putTakenScheduleDates(takenScheduleDates, config);
        return getAfterSeconds(currentTime, baseDate);
      }
      currentTime = addMinutes(currentTime, 60);
    }
    dayOffset++;
  }

  throw new Error("No available schedule date found");
}
