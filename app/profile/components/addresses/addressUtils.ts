import { parsePhoneNumberFromString } from "libphonenumber-js";

export const stateOptions = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const countryOptions = ["India"];
export const addressTypeOptions = ["Home", "Work", "Other"];

export const splitAddress = (address: string) => {
  const parts = (address || "").split(",");
  if (parts.length <= 1) return { building: address || "", street: "" };
  const building = parts.shift() || "";
  const street = parts.join(",").trim();
  return { building: building.trim(), street };
};

export const normalizePhone = (value: string) => {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(raw);
    if (parsed?.isValid()) return parsed.number;
    return raw;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && digits.startsWith("91")) return `+${digits}`;
  const parsed = parsePhoneNumberFromString(digits, "IN");
  if (parsed?.isValid()) return parsed.number;
  return raw;
};

export const isPhoneValid = (value: string) => {
  const raw = value.trim();
  if (!raw) return false;
  const parsed = parsePhoneNumberFromString(raw, "IN");
  if (parsed?.isValid()) return true;
  const digits = raw.replace(/\D/g, "");
  return !raw.startsWith("+") && digits.length === 10;
};
