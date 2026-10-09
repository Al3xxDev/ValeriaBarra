import { z } from "zod";

export const bookingRequestSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  phone: z.string().trim().min(6).max(40),
  appointmentType: z.enum(["Prima visita", "Controllo", "Colloquio conoscitivo"]),
  preferredDay: z.union([z.literal(""), z.iso.date()]).optional(),
  preferredTime: z.union([z.literal(""), z.enum(["Mattina", "Pomeriggio", "Indifferente"])]).optional(),
  message: z.string().trim().max(1200).optional(),
  privacyAccepted: z.literal(true),
  marketingAccepted: z.boolean().optional(),
  website: z.string().max(0).optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
