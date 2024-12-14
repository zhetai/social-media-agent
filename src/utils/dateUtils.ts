import { fromZonedTime } from "date-fns-tz";

/**
 * Converts a date string in any timezone to a UTC Date object
 * @param dateString - Date string in any timezone (e.g., "2024-01-01 12:00 PST" or "2024-01-01 12:00 America/Los_Angeles")
 * @returns Date object in UTC
 */
export function timezoneToUtc(dateString: string): Date | undefined {
  // Try to match both 3-letter codes and IANA timezone names
  const timezoneMatch = dateString.match(/ ([A-Z]{3,4}|America\/[A-Za-z_]+)$/);
  if (!timezoneMatch) {
    console.error("No timezone found in date string");
    return undefined;
  }

  const timezone = timezoneMatch[1];
  // Map common abbreviations to IANA names
  const timezoneMap: Record<string, string> = {
    // North America
    PST: "America/Los_Angeles", // Pacific Standard Time
    PDT: "America/Los_Angeles", // Pacific Daylight Time
    MST: "America/Denver", // Mountain Standard Time
    MDT: "America/Denver", // Mountain Daylight Time
    CST: "America/Chicago", // Central Standard Time
    CDT: "America/Chicago", // Central Daylight Time
    EST: "America/New_York", // Eastern Standard Time
    EDT: "America/New_York", // Eastern Daylight Time
    AKST: "America/Anchorage", // Alaska Standard Time
    AKDT: "America/Anchorage", // Alaska Daylight Time
    HST: "Pacific/Honolulu", // Hawaii Standard Time

    // Europe
    GMT: "Etc/GMT", // Greenwich Mean Time
    BST: "Europe/London", // British Summer Time
    CET: "Europe/Paris", // Central European Time
    CEST: "Europe/Paris", // Central European Summer Time
    EET: "Europe/Helsinki", // Eastern European Time
    EEST: "Europe/Helsinki", // Eastern European Summer Time

    // Asia/Pacific
    JST: "Asia/Tokyo", // Japan Standard Time
    KST: "Asia/Seoul", // Korea Standard Time
    IST: "Asia/Kolkata", // India Standard Time
    AEST: "Australia/Sydney", // Australian Eastern Standard Time
    AEDT: "Australia/Sydney", // Australian Eastern Daylight Time
    AWST: "Australia/Perth", // Australian Western Standard Time
    NZST: "Pacific/Auckland", // New Zealand Standard Time
    NZDT: "Pacific/Auckland", // New Zealand Daylight Time
  };

  const ianaTimezone = timezoneMap[timezone] || timezone;
  const withoutTz = dateString.replace(/ [A-Z]{3}$/, "");

  const parsedDate = new Date(withoutTz);
  if (isNaN(parsedDate.getTime())) {
    return undefined;
  }

  const newDate = fromZonedTime(parsedDate, ianaTimezone);
  if ((newDate as unknown as string) === "Invalid Date") {
    return undefined;
  }
  return newDate;
}
