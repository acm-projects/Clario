import { DESIGN_COMPANIES, type DesignCompany } from "./systemDesignCompanies";

export type CompanyBrand = Pick<DesignCompany, "name" | "color" | "ink" | "mark" | "icon" | "logo">;

/** Brand styling for a company name; unknown companies get a navy monogram. */
export function brandFor(name: string): CompanyBrand {
  const known = DESIGN_COMPANIES.find(item => item.name.toLowerCase() === name.trim().toLowerCase());
  if (known) return known;
  const words = name.trim().split(/\s+/).filter(Boolean);
  const mark = (words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 1)).toUpperCase() || "?";
  return { name, color: "#182137", ink: "#ffffff", mark };
}
