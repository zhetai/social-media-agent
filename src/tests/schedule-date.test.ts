import { jest } from "@jest/globals";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { fromZonedTime } from "date-fns-tz";
import {
  getScheduledDateSeconds,
  validateAfterSeconds,
} from "../agents/generate-post/nodes/schedule-post/find-date.js";

// Mock the current date to be fixed
const MOCK_CURRENT_DATE = fromZonedTime(
  new Date("2025-01-03T12:00:00"),
  "America/Los_Angeles",
);
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
      const futureDate = new Date("2025-01-04T10:00:00-08:00");
      const result = await getScheduledDateSeconds(futureDate, mockConfig);
      expect(result).toBeGreaterThan(0);
    });

    it("should throw error for past date", async () => {
      const pastDate = new Date("2024-01-01T10:00:00-08:00");
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

      it("should find next available Saturday slot", async () => {
        // Jan 3, 2025 is a Friday, so next Saturday is Jan 4
        const result = await getScheduledDateSeconds(
          "p1",
          mockConfig,
          MOCK_CURRENT_DATE,
        );
        const expectedDate = fromZonedTime(
          new Date("2025-01-04T08:00:00"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });

      it("should skip taken slots and find next available", async () => {
        const takenSlot = fromZonedTime(
          new Date("2025-01-04T08:00:00"),
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
        const expectedDate = fromZonedTime(
          new Date("2025-01-04T09:00:00"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });

      it("should find slots beyond 7 days when all closer slots are taken", async () => {
        // Create taken slots for all weekend slots in the next 7 days
        const takenSlots = [];
        let currentDate = MOCK_CURRENT_DATE;
        
        // Fill up the next 7 days of weekend slots
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          
          if (date.getDay() === 0 || date.getDay() === 6) { // Saturday or Sunday
            for (let hour = 8; hour <= 10; hour++) {
              takenSlots.push(
                fromZonedTime(
                  new Date(date.setHours(hour, 0, 0, 0)),
                  "America/Los_Angeles"
                )
              );
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

        // Next available slot should be on Saturday, January 11th (8 days from MOCK_CURRENT_DATE)
        const expectedDate = fromZonedTime(
          new Date("2025-01-11T08:00:00"),
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

      it("should find Friday slot when current day is Friday", async () => {
        const result = await getScheduledDateSeconds(
          "p2",
          mockConfig,
          MOCK_CURRENT_DATE,
        );
        // Current date is Friday, Jan 3 at noon, so should get next Monday Jan 6 at 8 AM
        const expectedDate = fromZonedTime(
          new Date("2025-01-06T08:00:00"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });

      it("should find weekend slot in 11:30 AM-1 PM range", async () => {
        // Mock store to show 8-10 AM slots are taken
        const takenSlots = [
          fromZonedTime(new Date("2025-01-03T08:00:00"), "America/Los_Angeles"),
          fromZonedTime(new Date("2025-01-03T09:00:00"), "America/Los_Angeles"),
          fromZonedTime(new Date("2025-01-03T10:00:00"), "America/Los_Angeles"),
        ];
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
        const expectedDate = fromZonedTime(
          new Date("2025-01-06T08:00:00"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });

      it("should find slots beyond 7 days when all closer slots are taken", async () => {
        // Create taken slots for all valid P2 slots in the next 7 days
        const takenSlots = [];
        let currentDate = MOCK_CURRENT_DATE;
        
        // Fill up the next 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          
          // For weekdays (Monday and Friday)
          if (isMonday(date) || isFriday(date)) {
            for (let hour = 8; hour <= 10; hour++) {
              takenSlots.push(
                fromZonedTime(
                  new Date(date.setHours(hour, 0, 0, 0)),
                  "America/Los_Angeles"
                )
              );
            }
          }
          // For weekends
          if (date.getDay() === 0 || date.getDay() === 6) {
            for (let hour = 11; hour <= 13; hour++) {
              takenSlots.push(
                fromZonedTime(
                  new Date(date.setHours(hour, 0, 0, 0)),
                  "America/Los_Angeles"
                )
              );
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

        // Next available slot should be on Friday, January 10th
        const expectedDate = fromZonedTime(
          new Date("2025-01-10T08:00:00"),
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

      it("should find first available weekend slot at 1 PM", async () => {
        const result = await getScheduledDateSeconds(
          "p3",
          mockConfig,
          MOCK_CURRENT_DATE,
        );
        const expectedDate = fromZonedTime(
          new Date("2025-01-04T13:00:00"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });

      it("should find slots beyond 7 days when all closer slots are taken", async () => {
        // Create taken slots for all P3 weekend slots in the next 7 days
        const takenSlots = [];
        let currentDate = MOCK_CURRENT_DATE;
        
        // Fill up the next 7 days of weekend slots
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          
          if (date.getDay() === 0 || date.getDay() === 6) { // Saturday or Sunday
            for (let hour = 13; hour <= 17; hour++) {
              takenSlots.push(
                fromZonedTime(
                  new Date(date.setHours(hour, 0, 0, 0)),
                  "America/Los_Angeles"
                )
              );
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

        // Next available slot should be on Saturday, January 11th (8 days from MOCK_CURRENT_DATE)
        const expectedDate = fromZonedTime(
          new Date("2025-01-11T13:00:00"),
          "America/Los_Angeles",
        );
        const expectedSeconds = Math.floor(
          (expectedDate.getTime() - MOCK_CURRENT_DATE.getTime()) / 1000,
        );
        expect(result).toBe(expectedSeconds);
      });
    });

    it("should throw error for invalid priority", async () => {
      await expect(
        getScheduledDateSeconds("p4" as any, mockConfig, MOCK_CURRENT_DATE),
      ).rejects.toThrow("Invalid priority level");
    });
  });
});

function isMonday(date: Date): boolean {
  return date.getDay() === 1;
}

function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}
