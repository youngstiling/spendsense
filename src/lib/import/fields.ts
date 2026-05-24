import type { SystemFieldKey } from "./types";

export type SystemFieldDef = {
  key: SystemFieldKey;
  label: string;
  required: boolean;
  description: string;
};

export const SYSTEM_FIELDS: SystemFieldDef[] = [
  {
    key: "date",
    label: "Date",
    required: true,
    description: "Transaction date (YYYY-MM-DD, DD/MM/YYYY, etc.)",
  },
  {
    key: "amount",
    label: "Amount",
    required: true,
    description: "Spend amount in GBP",
  },
  {
    key: "supplier",
    label: "Supplier",
    required: false,
    description: "Vendor or supplier name",
  },
  {
    key: "description",
    label: "Description",
    required: false,
    description: "Line item or transaction description (used for auto-categorisation)",
  },
  {
    key: "category",
    label: "Category",
    required: false,
    description:
      "Spend category (Drinks, Food, Utilities, Cleaning, etc.) — auto-filled if blank",
  },
  {
    key: "pub",
    label: "Pub / Site",
    required: false,
    description: "Venue or location name",
  },
];

export const REQUIRED_FIELDS = SYSTEM_FIELDS.filter((f) => f.required).map(
  (f) => f.key
);
