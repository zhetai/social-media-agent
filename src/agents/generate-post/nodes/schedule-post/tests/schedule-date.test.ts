import { jest } from "@jest/globals";
import { InMemoryStore, LangGraphRunnableConfig } from "@langchain/langgraph";
import { toZonedTime } from "date-fns-tz";

import {
  getScheduledDateSeconds,
  getTakenScheduleDates,
  isDateTaken,
  putTakenScheduleDates,
  validateAfterSeconds,
} from "../find-date.js";

// Define MOCK_CURRENT_DATE in UTC or as per the mocked timezone
// const MOCK_CURRENT_DATE = new Date("2025-01-03T12:00:00-08:00"); // This aligns with 'America/Los_Angeles'
const MOCK_CURRENT_DATE = new Date("2025-01-10T21:52:34.074Z");

jest.useFakeTimers();
jest.setSystemTime(MOCK_CURRENT_DATE);

describe("Schedule Date Tests", () => {
  let mockStore: any;
  let mockConfig: LangGraphRunnableConfig;

  beforeEach(() => {
    mockStore = {
      get: jest.fn(),
      put: jest.fn(),
    };
    mockConfig = {
      store: mockStore,
    } as any;
  });

  describe("validateAfterSeconds", () => {
    it("should throw error for negative seconds", () => {
      expect(() => validateAfterSeconds(-1)).toThrow(
        "Schedule date must be in the future",
      );
    });

    it("should not throw error for positive seconds", () => {
      expect(() => validateAfterSeconds(1)).not.toThrow();
    });
  });

  describe("getScheduledDateSeconds", () => {
    it("should return seconds for a valid future date", async () => {
      const futureDate = toZonedTime(
        new Date("2025-01-04T18:00:00Z"),
        "America/Los_Angeles",
      );
      const result = await getScheduledDateSeconds(futureDate, mockConfig);
      expect(result).toBeGreaterThan(0);
    });

    it("should throw error for past date", async () => {
      const pastDate = toZonedTime(
        new Date("2024-01-01T18:00:00Z"),
        "America/Los_Angeles",
      );
      await expect(
        getScheduledDateSeconds(pastDate, mockConfig),
      ).rejects.toThrow("Schedule date must be in the future");
    });

    describe("Priority P1 (Weekend 8-10 AM PST)", () => {
      beforeEach(() => {
        mockStore.get.mockResolvedValue({
          value: { taken_dates: { p1: [], p2: [], p3: [] } },
        });
      });

      it("should skip taken slots and find next available", async () => {
        const takenSlot = toZonedTime(
          new Date("2025-01-04T16:00:00Z"),
          "America/Los_Angeles",
        );
        mockStore.get.mockResolvedValue({
          value: {
            taken_dates: {
              p1: [takenSlot],
              p2: [],
              p3: [],
            },
          },
        });

        const result = await getScheduledDateSeconds(
          "p1",
          mockConfig,
          MOCK_CURRENT_DATE,
        );

        // Expected: Jan 4, 2025 9:00 PST = 17:00 UTC
        const expectedDate = toZonedTime(
          new Date("2025-01-04T17:00:00Z"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });

      it("should find slots beyond 7 days when all closer slots are taken", async () => {
        const takenSlots = [];
        const currentDate = new Date(MOCK_CURRENT_DATE);

        // Fill up the next 7 days of weekend slots
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          const pstDate = toZonedTime(date, "America/Los_Angeles");

          if (pstDate.getDay() === 0 || pstDate.getDay() === 6) {
            // Saturday or Sunday
            for (let hour = 8; hour <= 10; hour++) {
              const slotDate = new Date(date);
              slotDate.setUTCHours(hour + 8, 0, 0, 0); // Convert PST to UTC
              takenSlots.push(toZonedTime(slotDate, "America/Los_Angeles"));
            }
          }
        }

        mockStore.get.mockResolvedValue({
          value: {
            taken_dates: {
              p1: takenSlots,
              p2: [],
              p3: [],
            },
          },
        });

        const result = await getScheduledDateSeconds(
          "p1",
          mockConfig,
          MOCK_CURRENT_DATE,
        );

        // Next available slot should be on Saturday, January 11th at 8:00 PST = 16:00 UTC
        const expectedDate = toZonedTime(
          new Date("2025-01-11T16:00:00Z"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });
    });

    describe("Priority P2 (Fri/Mon 8-10 AM or Weekend 11:30 AM-1 PM PST)", () => {
      beforeEach(() => {
        mockStore.get.mockResolvedValue({
          value: { taken_dates: { p1: [], p2: [], p3: [] } },
        });
      });

      it("should find slots beyond 7 days when all closer slots are taken", async () => {
        const takenSlots = [];
        const currentDate = new Date(MOCK_CURRENT_DATE);

        // Fill up the next 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          const pstDate = toZonedTime(date, "America/Los_Angeles");

          if (pstDate.getDay() === 1 || pstDate.getDay() === 5) {
            // Monday or Friday
            for (let hour = 8; hour <= 10; hour++) {
              const slotDate = new Date(date);
              slotDate.setUTCHours(hour + 8, 0, 0, 0); // Convert PST to UTC
              takenSlots.push(toZonedTime(slotDate, "America/Los_Angeles"));
            }
          }
          if (pstDate.getDay() === 0 || pstDate.getDay() === 6) {
            // Weekend
            for (let hour = 11; hour <= 13; hour++) {
              const slotDate = new Date(date);
              slotDate.setUTCHours(hour + 8, 0, 0, 0); // Convert PST to UTC
              takenSlots.push(toZonedTime(slotDate, "America/Los_Angeles"));
            }
          }
        }

        mockStore.get.mockResolvedValue({
          value: {
            taken_dates: {
              p1: [],
              p2: takenSlots,
              p3: [],
            },
          },
        });

        const result = await getScheduledDateSeconds(
          "p2",
          mockConfig,
          MOCK_CURRENT_DATE,
        );

        // Next available slot should be on Friday, January 10th at 8:00 PST = 16:00 UTC
        const expectedDate = toZonedTime(
          new Date("2025-01-10T16:00:00Z"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });
    });

    describe("Priority P3 (Weekend 1-5 PM PST)", () => {
      beforeEach(() => {
        mockStore.get.mockResolvedValue({
          value: { taken_dates: { p1: [], p2: [], p3: [] } },
        });
      });

      it("should find slots beyond 7 days when all closer slots are taken", async () => {
        const takenSlots = [];
        const currentDate = new Date(MOCK_CURRENT_DATE);

        // Fill up the next 7 days of weekend slots
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          const pstDate = toZonedTime(date, "America/Los_Angeles");

          if (pstDate.getDay() === 0 || pstDate.getDay() === 6) {
            // Saturday or Sunday
            for (let hour = 13; hour <= 17; hour++) {
              const slotDate = new Date(date);
              slotDate.setUTCHours(hour + 8, 0, 0, 0); // Convert PST to UTC
              takenSlots.push(toZonedTime(slotDate, "America/Los_Angeles"));
            }
          }
        }

        mockStore.get.mockResolvedValue({
          value: {
            taken_dates: {
              p1: [],
              p2: [],
              p3: takenSlots,
            },
          },
        });

        const result = await getScheduledDateSeconds(
          "p3",
          mockConfig,
          MOCK_CURRENT_DATE,
        );

        // Next available slot should be on Saturday, January 11th at 13:00 PST = 21:00 UTC
        const expectedDate = toZonedTime(
          new Date("2025-01-11T21:00:00Z"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });
    });

    describe("Priority Time Window Tests", () => {
      beforeEach(() => {
        mockStore.get.mockResolvedValue({
          value: { taken_dates: { p1: [], p2: [], p3: [] } },
        });
      });

      describe("P1 Time Window Tests", () => {
        it("should only return dates on weekends between 8:00 AM and 10:00 AM PST", async () => {
          // Test for 100 iterations to ensure we never get invalid times
          for (let i = 0; i < 100; i++) {
            const result = await getScheduledDateSeconds(
              "p1",
              mockConfig,
              MOCK_CURRENT_DATE,
            );
            const scheduledDate = new Date(
              MOCK_CURRENT_DATE.getTime() + result * 1000,
            );
            const pstDate = toZonedTime(scheduledDate, "America/Los_Angeles");

            // Verify it's a weekend
            const day = pstDate.getDay();
            expect(day === 0 || day === 6).toBe(true); // Sunday or Saturday

            // Verify time is between 8:00 AM and 10:00 AM PST
            expect(pstDate.getHours()).toBeGreaterThanOrEqual(8);
            expect(pstDate.getHours()).toBeLessThanOrEqual(10);
            if (pstDate.getHours() === 10) {
              expect(pstDate.getMinutes()).toBe(0);
            }
          }
        });
      });

      describe("P2 Time Window Tests", () => {
        it("should return dates on Friday/Monday between 8:00 AM and 10:00 AM PST, or weekends between 10:30 AM and 1:00 PM PST", async () => {
          // Test for 100 iterations to ensure we never get invalid times
          for (let i = 0; i < 100; i++) {
            const result = await getScheduledDateSeconds(
              "p2",
              mockConfig,
              MOCK_CURRENT_DATE,
            );
            const scheduledDate = new Date(
              MOCK_CURRENT_DATE.getTime() + result * 1000,
            );
            const pstDate = toZonedTime(scheduledDate, "America/Los_Angeles");

            const day = pstDate.getDay();
            const hour = pstDate.getHours();
            const minutes = pstDate.getMinutes();

            const isWeekday = day === 1 || day === 5; // Monday or Friday
            const isWeekend = day === 0 || day === 6; // Saturday or Sunday
            expect(isWeekday || isWeekend).toBe(true);

            if (isWeekday) {
              // Verify time is between 8:00 AM and 10:00 AM PST
              expect(hour).toBeGreaterThanOrEqual(8);
              expect(hour).toBeLessThanOrEqual(10);
              if (hour === 10) {
                expect(minutes).toBe(0);
              }
            } else {
              // Verify time is between 10:30 AM and 1:00 PM PST
              if (hour === 10) {
                expect(minutes).toBeGreaterThanOrEqual(30);
              } else {
                expect(hour).toBeGreaterThanOrEqual(11);
                expect(hour).toBeLessThanOrEqual(13);
                if (hour === 13) {
                  expect(minutes).toBe(0);
                }
              }
            }
          }
        });
      });

      describe("P3 Time Window Tests", () => {
        it("should only return dates on weekends between 1:00 PM and 5:00 PM PST", async () => {
          // Test for 100 iterations to ensure we never get invalid times
          for (let i = 0; i < 100; i++) {
            const result = await getScheduledDateSeconds(
              "p3",
              mockConfig,
              MOCK_CURRENT_DATE,
            );
            const scheduledDate = new Date(
              MOCK_CURRENT_DATE.getTime() + result * 1000,
            );
            const pstDate = toZonedTime(scheduledDate, "America/Los_Angeles");

            // Verify it's a weekend
            const day = pstDate.getDay();
            expect(day === 0 || day === 6).toBe(true); // Sunday or Saturday

            // Verify time is between 1:00 PM and 5:00 PM PST
            expect(pstDate.getHours()).toBeGreaterThanOrEqual(13);
            expect(pstDate.getHours()).toBeLessThanOrEqual(17);
            if (pstDate.getHours() === 17) {
              expect(pstDate.getMinutes()).toBe(0);
            }
          }
        });
      });
    });

    it("should throw error for invalid priority", async () => {
      await expect(
        getScheduledDateSeconds("p4" as any, mockConfig, MOCK_CURRENT_DATE),
      ).rejects.toThrow("Invalid priority level");
    });
  });

  describe.only("getScheduledDateSeconds2", () => {
    it("Can actually get the right time", async () => {
      const store = new InMemoryStore();
      const config = {
        store,
      } as any;
      const TAKEN_DATES = {
        "p1": [
          new Date("2025-01-11T16:00:44.927Z"),
        ],
        "p2": [
          new Date("2025-01-06T16:00:49.421Z"),
          new Date("2025-01-10T16:00:32.265Z"),
          new Date("2025-01-10T16:00:06.203Z"),
          new Date("2025-01-10T16:00:52.327Z"),
          new Date("2025-01-13T16:00:39.616Z"),
        ],
        "p3": [],
      };
      await putTakenScheduleDates(TAKEN_DATES, config);
      const seconds = await getScheduledDateSeconds("p1", config);
      console.log(seconds);
      const newTakenDates = await getTakenScheduleDates(config);
      console.dir(newTakenDates, { depth: null });
    });
  });

  describe("isDateTaken", () => {
    it("Can properly check if a date is taken", () => {
      const priority = "p1";
      const takenDates = {
        "p1": [
          new Date("2025-01-11T16:00:44.927Z"),
        ],
        "p2": [],
        "p3": []
      }
      const dateToCheck = new Date("2025-01-11T16:00:35.394Z");

      const isTaken = isDateTaken(dateToCheck, takenDates, priority);
      expect(isTaken).toBe(true);
    })
  })
});
