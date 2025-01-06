import { jest } from "@jest/globals";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { toZonedTime } from "date-fns-tz";
import {
  getScheduledDateSeconds,
  validateAfterSeconds,
} from "../agents/generate-post/nodes/schedule-post/find-date.js";

// Mock the current date to be fixed at 2025-01-03 12:00:00 PST
const MOCK_CURRENT_DATE = new Date("2025-01-03T20:00:00Z"); // 12:00 PST = 20:00 UTC
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
      const futureDate = new Date("2025-01-04T18:00:00Z"); // 10:00 PST
      const result = await getScheduledDateSeconds(futureDate, mockConfig);
      expect(result).toBeGreaterThan(0);
    });

    it("should throw error for past date", async () => {
      const pastDate = new Date("2024-01-01T18:00:00Z"); // 10:00 PST
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
        const takenSlot = new Date("2025-01-04T16:00:00Z"); // 8:00 PST
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
        const expectedSeconds = Math.floor(
          (new Date("2025-01-04T17:00:00Z").getTime() - MOCK_CURRENT_DATE.getTime()) / 1000
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
              takenSlots.push(slotDate);
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
        const expectedSeconds = Math.floor(
          (new Date("2025-01-11T16:00:00Z").getTime() - MOCK_CURRENT_DATE.getTime()) / 1000
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
              takenSlots.push(slotDate);
            }
          }
          if (pstDate.getDay() === 0 || pstDate.getDay() === 6) {
            // Weekend
            for (let hour = 11; hour <= 13; hour++) {
              const slotDate = new Date(date);
              slotDate.setUTCHours(hour + 8, 0, 0, 0); // Convert PST to UTC
              takenSlots.push(slotDate);
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
        const expectedSeconds = Math.floor(
          (new Date("2025-01-10T16:00:00Z").getTime() - MOCK_CURRENT_DATE.getTime()) / 1000
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
              takenSlots.push(slotDate);
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
        const expectedSeconds = Math.floor(
          (new Date("2025-01-11T21:00:00Z").getTime() - MOCK_CURRENT_DATE.getTime()) / 1000
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
