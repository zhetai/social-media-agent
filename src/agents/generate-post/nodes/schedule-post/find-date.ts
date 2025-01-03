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
async function getTakenScheduleDates(
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
  return takenDates.value?.[TAKEN_DATES_KEY];
}

/**
 * Updates the store with a new taken scheduled date
 * @param {TakenScheduleDates} takenDates The new taken schedule dates
 * @param {LangGraphRunnableConfig} config
 * @returns {Promise<void>}
 */
async function putTakenScheduleDates(
  takenDates: TakenScheduleDates,
  config: LangGraphRunnableConfig,
): Promise<void> {
  const { store } = config;
  if (!store) {
    throw new Error("No store provided");
  }
  await store.put(NAMESPACE, KEY, {
    [TAKEN_DATES_KEY]: takenDates,
  });
}

function getAfterSeconds(date: Date, baseDate: Date = new Date()): number {
  return Math.floor((date.getTime() - baseDate.getTime()) / 1000);
}

function isDateTaken(
  date: Date,
  takenDates: TakenScheduleDates | undefined,
): boolean {
  if (!takenDates) return false;
  const dateTime = date.getTime();
  return Object.values(takenDates).some((dates) =>
    dates.some((takenDate) => {
      const takenDateTime = takenDate.getTime();
      return Math.abs(takenDateTime - dateTime) < 1000; // Allow 1 second difference
    }),
  );
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

  // For P1 and P3, only look at the next weekend
  if (priority === "p1" || priority === "p3") {
    const nextWeekendDay = getNextValidDay(baseDate, priority);
    const { start, end } = getTimeRangeForPriority(nextWeekendDay, priority);

    let currentTime = start;
    while (currentTime <= end) {
      if (!isDateTaken(currentTime, takenScheduleDates)) {
        // Convert to UTC before storing
        const utcDate = fromZonedTime(currentTime, "America/Los_Angeles");
        validateScheduleDate(utcDate, baseDate);
        takenScheduleDates[priority].push(utcDate);
        await putTakenScheduleDates(takenScheduleDates, config);
        return getAfterSeconds(utcDate, baseDate);
      }
      currentTime = addMinutes(currentTime, 5);
    }

    // For weekend priorities, if we didn't find a slot in the next weekend day,
    // try the day after
    if (isSaturday(nextWeekendDay)) {
      const nextDay = addDays(nextWeekendDay, 1);
      const { start, end } = getTimeRangeForPriority(nextDay, priority);

      let currentTime = start;
      while (currentTime <= end) {
        if (!isDateTaken(currentTime, takenScheduleDates)) {
          // Convert to UTC before storing
          const utcDate = fromZonedTime(currentTime, "America/Los_Angeles");
          validateScheduleDate(utcDate, baseDate);
          takenScheduleDates[priority].push(utcDate);
          await putTakenScheduleDates(takenScheduleDates, config);
          return getAfterSeconds(utcDate, baseDate);
        }
        currentTime = addMinutes(currentTime, 5);
      }
    }

    // If all slots are taken, pick a random one from the existing slots
    if (takenScheduleDates[priority].length > 0) {
      const randomIndex = Math.floor(
        Math.random() * takenScheduleDates[priority].length,
      );
      const randomDate = takenScheduleDates[priority][randomIndex];
      return getAfterSeconds(randomDate, baseDate);
    }

    throw new Error(
      `No existing schedule dates found for priority level ${priority}. This is unexpected - there should always be at least one taken date.`,
    );
  }

  // For P2, try the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const candidateDate = addDays(baseDate, dayOffset);
    const nextValidDay = getNextValidDay(candidateDate, priority);
    const { start, end } = getTimeRangeForPriority(nextValidDay, priority);

    let currentTime = start;
    while (currentTime <= end) {
      if (!isDateTaken(currentTime, takenScheduleDates)) {
        // Convert to UTC before storing
        const utcDate = fromZonedTime(currentTime, "America/Los_Angeles");
        validateScheduleDate(utcDate, baseDate);
        takenScheduleDates[priority].push(utcDate);
        await putTakenScheduleDates(takenScheduleDates, config);
        return getAfterSeconds(utcDate, baseDate);
      }
      currentTime = addMinutes(currentTime, 5);
    }
  }

  // If all slots are taken for P2, pick a random one from the existing slots
  if (takenScheduleDates[priority].length > 0) {
    const randomIndex = Math.floor(
      Math.random() * takenScheduleDates[priority].length,
    );
    const randomDate = takenScheduleDates[priority][randomIndex];
    return getAfterSeconds(randomDate, baseDate);
  }

  throw new Error(
    `No existing schedule dates found for priority level ${priority}. This is unexpected - there should always be at least one taken date.`,
  );
}
