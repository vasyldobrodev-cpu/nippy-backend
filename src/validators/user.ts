import { z } from "zod";

// 4. Notification Settings Schema
export const updateNotificationSettingsSchema = z
  .object({
    emailNotifications: z.boolean(),
    newFreelancerProposals: z.boolean(),
    jobStatusUpdates: z.boolean(),
    newMessageAlertsWeb: z.boolean(),
    newMessageAlertsEmail: z.boolean(),
    messageReadReceipts: z.boolean(),
    platformUpdates: z.boolean(),
    promotionsOffers: z.boolean(),
    pushNotifications: z.boolean(),
    desktopNotifications: z.boolean(),
    mobilePushNotifications: z.boolean(),
    notificationFrequency: z.enum(["realtime", "daily", "weekly"]),
    quietHoursEnabled: z.boolean(),
    quietHoursWeekends: z.boolean(),
    quietHoursFrom: z.string(),
    quietHoursTo: z.string(),
    notificationSound: z.enum(["on", "off"]),
  })
  .strict();
import { BusinessType } from "../entities/User";

// Phone number validation (basic international format)
const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    "Invalid phone number format. Use international format: +1234567890"
  )
  .optional();

// Email validation
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(5, "Email must be at least 5 characters")
  .max(100, "Email must not exceed 100 characters");

// Avatar validation (size check will be handled in middleware)
const avatarSchema = z.string().url("Avatar must be a valid URL").optional();

// 1. Basic Profile Schema (firstName, lastName, phone, businessType)
export const updateBasicProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .optional(),

    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .optional(),

    phone: z.string().optional(),

    businessType: z.nativeEnum(BusinessType).optional(),
  })
  .strict();

// 2. Location Schema (country, city, timezone, language)
export const updateLocationSchema = z
  .object({
    country: z
      .string()
      .min(2, "Country must be at least 2 characters")
      .max(100, "Country must be less than 100 characters")
      .optional(),

    city: z
      .string()
      .min(2, "City must be at least 2 characters")
      .max(100, "City must be less than 100 characters")
      .optional(),

    timezone: z
      .string()
      .min(3, "Timezone must be valid")
      .max(50, "Timezone must be less than 50 characters")
      .optional(),

    language: z
      .string()
      .min(2, "Language must be at least 2 characters")
      .max(50, "Language must be less than 50 characters")
      .optional(),
  })
  .strict();

// 3. Account Security Schema (email, password)
export const updateAccountSchema = z
  .object({
    email: z.string().email("Invalid email format").optional(),

    currentPassword: z
      .string()
      .min(1, "Current password is required when updating email or password"),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one lowercase, uppercase, and number"
      )
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Either email or password must be provided
      return data.email || data.newPassword;
    },
    {
      message: "Either email or newPassword must be provided",
    }
  );

// Country detection helper
export const detectCountryFromInput = (input: string): string => {
  const countryMappings: Record<string, string> = {
    usa: "United States",
    us: "United States",
    america: "United States",
    uk: "United Kingdom",
    britain: "United Kingdom",
    england: "United Kingdom",
    canada: "Canada",
    australia: "Australia",
    germany: "Germany",
    france: "France",
    japan: "Japan",
    korea: "South Korea",
    china: "China",
    india: "India",
    brazil: "Brazil",
    mexico: "Mexico",
    spain: "Spain",
    italy: "Italy",
    russia: "Russia",
  };

  const lowercaseInput = input.toLowerCase().trim();
  return countryMappings[lowercaseInput] || input;
};

// Dropdown options for frontend (kept for reference)
export const getDropdownOptions = () => {
  return {
    businessTypes: [
      { value: "cafe", label: "Cafe" },
      { value: "saloon", label: "Saloon" },
      { value: "clothing_store", label: "Clothing Store" },
      { value: "food_business", label: "Food Business" },
      { value: "other", label: "Other" },
    ],
    timezones: [
      { value: "UTC-12:00", label: "UTC-12:00 (Baker Island)" },
      { value: "UTC-11:00", label: "UTC-11:00 (American Samoa)" },
      { value: "UTC-10:00", label: "UTC-10:00 (Hawaii)" },
      { value: "UTC-09:00", label: "UTC-09:00 (Alaska)" },
      { value: "UTC-08:00", label: "UTC-08:00 (Pacific Time)" },
      { value: "UTC-07:00", label: "UTC-07:00 (Mountain Time)" },
      { value: "UTC-06:00", label: "UTC-06:00 (Central Time)" },
      { value: "UTC-05:00", label: "UTC-05:00 (Eastern Time)" },
      { value: "UTC+00:00", label: "UTC+00:00 (GMT)" },
      { value: "UTC+01:00", label: "UTC+01:00 (Central European Time)" },
      { value: "UTC+02:00", label: "UTC+02:00 (Eastern European Time)" },
      { value: "UTC+03:00", label: "UTC+03:00 (Moscow Time)" },
      { value: "UTC+05:30", label: "UTC+05:30 (India Standard Time)" },
      { value: "UTC+08:00", label: "UTC+08:00 (China Standard Time)" },
      { value: "UTC+09:00", label: "UTC+09:00 (Japan Standard Time)" },
      { value: "UTC+12:00", label: "UTC+12:00 (New Zealand)" },
    ],
    cities: [
      { value: "New York", label: "New York, USA" },
      { value: "Los Angeles", label: "Los Angeles, USA" },
      { value: "London", label: "London, UK" },
      { value: "Paris", label: "Paris, France" },
      { value: "Tokyo", label: "Tokyo, Japan" },
      { value: "Seoul", label: "Seoul, South Korea" },
      { value: "Berlin", label: "Berlin, Germany" },
      { value: "Sydney", label: "Sydney, Australia" },
      { value: "Toronto", label: "Toronto, Canada" },
      { value: "Dubai", label: "Dubai, UAE" },
    ],
    languages: [
      { value: "English", label: "English" },
      { value: "Spanish", label: "Spanish" },
      { value: "French", label: "French" },
      { value: "German", label: "German" },
      { value: "Chinese", label: "Chinese" },
      { value: "Japanese", label: "Japanese" },
      { value: "Korean", label: "Korean" },
      { value: "Arabic", label: "Arabic" },
      { value: "Portuguese", label: "Portuguese" },
      { value: "Russian", label: "Russian" },
    ],
  };
};
