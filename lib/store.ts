"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";

export const lifeExpectancySchema = z.number().min(1).max(200).int().positive();

export const birthdateSchema = z.string().refine(
  (date) => {
    const parsedDate = new Date(date);
    // cannot be in the future
    return !isNaN(parsedDate.getTime()) && parsedDate < new Date();
  },
  {
    message: "Invalid date format",
  }
);

interface TimeLeftState {
  birthdate: string | null;
  lifeExpectancy: number;
  validateAndSetBirthdate: (date: string) => boolean;
  validateAndSetLifeExpectancy: (years: number) => boolean;
}

export const useStore = create<TimeLeftState>()(
  persist(
    (set) => ({
      birthdate: null,
      lifeExpectancy: 80,
      validateAndSetBirthdate: (date) => {
        try {
          const validated = birthdateSchema.parse(date);
          set({ birthdate: validated });
          return true;
        } catch (error) {
          console.warn("Invalid birthdate value:", error);
          return false;
        }
      },
      validateAndSetLifeExpectancy: (years) => {
        try {
          const validated = lifeExpectancySchema.parse(years);
          set({ lifeExpectancy: validated });
          return true;
        } catch (error) {
          console.warn("Invalid life expectancy value:", error);
          return false;
        }
      },
    }),
    {
      name: "time-left-storage",
    }
  )
);
