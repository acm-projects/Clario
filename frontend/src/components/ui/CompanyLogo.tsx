import type { CompanyBrand } from "../../lib/companyBrands";

const SIZES = {
  xs: "size-8 rounded-full text-[11px]",
  sm: "size-10 rounded-xl text-sm",
  md: "size-14 rounded-2xl text-lg",
  lg: "size-20 rounded-[26px] text-2xl",
} as const;

export default function CompanyLogo({ company, size = "md" }: { company: CompanyBrand; size?: keyof typeof SIZES }) {
  return <span aria-hidden="true" className={`${SIZES[size]} grid shrink-0 place-items-center overflow-hidden font-bold tracking-tight shadow-[inset_0_0_0_1px_#0000000f]`} style={{ background: company.logo ? "#fff" : company.color, color: company.ink }}>
    {company.logo ? <img src={company.logo} alt="" className="size-3/4 object-contain" />
      : company.icon ? <svg viewBox="0 0 24 24" className="size-1/2" fill="currentColor"><path d={company.icon.path} /></svg>
      : company.mark}
  </span>;
}
