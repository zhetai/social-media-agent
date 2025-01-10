import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  isValid,
  addDays,
  setHours,
  setMinutes,
  isSaturday,
  isSunday,
  isFriday,
  isMonday,
  addMinutes,
} from "date-fns";
import { DateType } from "../../../types.js";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const ALLOWED_P1_DAY_AND_TIMES_IN_UTC = [
  // Sunday 8AM PST
  {
    day: 0, // Sunday
    hour: 16, // 8AM PST
  },
  // Sunday 9AM PST
  {
    day: 0, // Sunday
    hour: 17, // 9AM PST
  },
  // Sunday 10AM PST
  {
    day: 0, // Sunday
    hour: 18, // 10AM PST
  },
  // Saturday 8AM PST
  {
    day: 6, // Saturday
    hour: 16, // 8AM PST
  },
  // Saturday 9AM PST
  {
    day: 6, // Saturday
    hour: 17, // 9AM PST
  },
  // Saturday 10AM PST
  {
    day: 6, // Saturday
    hour: 18, // 10AM PST
  },
];

export const ALLOWED_P2_DAY_AND_TIMES_IN_UTC = [
  // Monday 8AM PST
  {
    day: 0, // Monday
    hour: 16, // 8AM PST
  },
  // Monday 9AM PST
  {
    day: 0, // Monday
    hour: 17, // 9AM PST
  },
  // Monday 10AM PST
  {
    day: 0, // Monday
    hour: 18, // 10AM PST
  },
  // Friday 8AM PST
  {
    day: 5, // Friday
    hour: 16, // 8AM PST
  },
  // Friday 9AM PST
  {
    day: 5, // Friday
    hour: 17, // 9AM PST
  },
  // Friday 10AM PST
  {
    day: 5, // Friday
    hour: 18, // 10AM PST
  },
  // Sunday 11AM PST
  {
    day: 0, // Sunday
    hour: 19, // 11AM PST
  },
  // Sunday 12PM PST
  {
    day: 0, // Sunday
    hour: 20, // 12PM PST
  },
  // Sunday 1PM PST
  {
    day: 0, // Sunday
    hour: 21, // 1PM PST
  },
  // Saturday 11AM PST
  {
    day: 6, // Saturday
    hour: 19, // 11AM PST
  },
  // Saturday 12PM PST
  {
    day: 6, // Saturday
    hour: 20, // 12PM PST
  },

  {
    day: 6, // Saturday
    hour: 21, // 1PM PST
  },
];

export const ALLOWED_P3_DAY_AND_TIMES_IN_UTC = [
  // Sunday 1PM PST
  {
    day: 0, // Sunday
    hour: 21, // 1PM PST
  },
  // Sunday 2PM PST
  {
    day: 0, // Sunday
    hour: 22, // 2PM PST
  },
  // Sunday 3PM PST
  {
    day: 0, // Sunday
    hour: 23, // 3PM PST
  },
  // Sunday 4PM PST
  {
    day: 0, // Sunday
    hour: 24, // 4PM PST
  },
  // Sunday 5PM PST
  {
    day: 1, // Sunday (Monday in UTC)
    hour: 1, // 5PM PST
  },
  // Saturday 1PM PST
  {
    day: 6, // Saturday
    hour: 21, // 1PM PST
  },
  // Saturday 2PM PST
  {
    day: 6, // Saturday
    hour: 22, // 2PM PST
  },
  // Saturday 3PM PST
  {
    day: 6, // Saturday
    hour: 23, // 3PM PST
  },
  // Saturday 4PM PST
  {
    day: 6, // Saturday
    hour: 24, // 4PM PST
  },
  // Saturday 5PM PST
  {
    day: 7, // Saturday (Sunday in UCT)
    hour: 1, // 5PM PST
  },
];

export function validateAfterSeconds(afterSeconds: number) {
  // If after seconds is negative, throw an error
  if (afterSeconds < 0) {
    throw new Error(
      `Schedule date must be in the future. Instead, received: ${afterSeconds} seconds.`,
    );
  }
}

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
  const hour = date.getHours();
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  // Only check dates within the same priority level
  const priorityDates = takenDates[priority];
  return priorityDates.some((takenDate) => {
    return (
      hour === takenDate.getHours() &&
      day === takenDate.getDate() &&
      month === takenDate.getMonth() &&
      year === takenDate.getFullYear()
    );
  });
}

function getNextValidDay(
  currentDate: Date,
  priority: "p1" | "p2" | "p3",
): Date {
  const pstDate = toZonedTime(currentDate, "America/Los_Angeles");
  const currentHour = pstDate.getHours();
  const currentMinutes = pstDate.getMinutes();

  // For the current day, check if we've passed the time window
  const isPastTimeWindow = (day: Date): boolean => {
    const { end } = getTimeRangeForPriority(day, priority);
    return (
      currentHour > end.getHours() ||
      (currentHour === end.getHours() && currentMinutes >= end.getMinutes())
    );
  };

  // For P2, first try to find a valid weekday (Friday or Monday)
  if (priority === "p2") {
    for (let i = 0; i < 7; i += 1) {
      const candidateDate = addDays(pstDate, i);
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
      const candidateDate = addDays(pstDate, i);
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
    const candidateDate = addDays(pstDate, i);
    if (isSaturday(candidateDate) || isSunday(candidateDate)) {
      if (i === 0 && isPastTimeWindow(candidateDate)) {
        continue;
      }
      return candidateDate;
    }
  }

  // If no valid day found in the next week, return the last checked date
  return addDays(pstDate, 6);
}

function getTimeRangeForPriority(
  date: Date,
  priority: "p1" | "p2" | "p3",
): { start: Date; end: Date } {
  const isWeekend = isSaturday(date) || isSunday(date);

  if (priority === "p1") {
    return {
      start: setMinutes(setHours(date, 8), 0),
      end: setMinutes(setHours(date, 10), 0),
    };
  } else if (priority === "p2") {
    if (isWeekend) {
      return {
        start: setMinutes(setHours(date, 11), 30),
        end: setMinutes(setHours(date, 13), 0),
      };
    } else {
      return {
        start: setMinutes(setHours(date, 8), 0),
        end: setMinutes(setHours(date, 10), 0),
      };
    }
  } else {
    return {
      start: setMinutes(setHours(date, 13), 0),
      end: setMinutes(setHours(date, 17), 0),
    };
  }
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
  console.log("ATTEMPTING TO FIND A SCHEDULE DATE", {
    scheduleDate,
    baseDate,
  });
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
          console.log("FOUND A SCHEDULE DATE", {
            priority,
            currentTime,
          });
          // Convert to UTC before storing
          const utcDate = fromZonedTime(currentTime, "America/Los_Angeles");
          validateScheduleDate(utcDate, baseDate);
          takenScheduleDates[priority].push(utcDate);
          await putTakenScheduleDates(takenScheduleDates, config);
          return getAfterSeconds(utcDate, baseDate);
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
            // Convert to UTC before storing
            const utcDate = fromZonedTime(currentTime, "America/Los_Angeles");
            validateScheduleDate(utcDate, baseDate);
            takenScheduleDates[priority].push(utcDate);
            await putTakenScheduleDates(takenScheduleDates, config);
            return getAfterSeconds(utcDate, baseDate);
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
        // Convert to UTC before storing
        const utcDate = fromZonedTime(currentTime, "America/Los_Angeles");
        validateScheduleDate(utcDate, baseDate);
        takenScheduleDates[priority].push(utcDate);
        await putTakenScheduleDates(takenScheduleDates, config);
        return getAfterSeconds(utcDate, baseDate);
      }
      currentTime = addMinutes(currentTime, 60);
    }
    dayOffset++;
  }

  throw new Error("No available schedule date found");
}
