import { z } from "zod";

const numberFromString = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number()
);
const optionalNumberFromString = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional()
);
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional()
);

export const tradeFormSchema = z
  .object({
    accountId: z.string().min(1, "Account is required"),
    symbol: z
      .string()
      .min(1, "Symbol is required")
      .max(20)
      .transform((s) => s.trim().toUpperCase()),
    direction: z.enum(["LONG", "SHORT"]),
    contracts: numberFromString.refine((n) => n > 0, "Contracts must be > 0"),
    entryPrice: optionalNumberFromString,
    exitPrice: optionalNumberFromString,
    stopPrice: optionalNumberFromString,
    targetPrice: optionalNumberFromString,
    pnl: numberFromString,
    result: z.enum(["WIN", "LOSS", "BREAKEVEN"]),
    openedAt: z.string().min(1, "Open date/time is required"),
    closedAt: z.string().min(1, "Close date/time is required"),
    notes: optionalString,
    screenshotUrl: optionalString.refine(
      (v) => !v || /^https?:\/\//i.test(v) || v.startsWith("/"),
      "Must be a URL or absolute path"
    ),
    rulesFollowed: z.array(z.string()).default([]),
  })
  .refine(
    (v) => new Date(v.closedAt).getTime() >= new Date(v.openedAt).getTime(),
    { message: "Close time must be after open time", path: ["closedAt"] }
  );

export type TradeFormValues = z.infer<typeof tradeFormSchema>;

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  broker: optionalString,
});
export type AccountFormValues = z.infer<typeof accountFormSchema>;
