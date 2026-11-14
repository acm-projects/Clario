import type { ReactNode } from "react";

export default function PageHeading({ eyebrow, title, subtitle, id }: {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  id?: string;
}) {
  return <header className={"app-page-heading [&.app-page-heading]:[min-width:0] [&.app-page-heading]:[margin-bottom:36px] [&.app-page-heading]:[font-family:\"DM_Sans\",sans-serif] [&.app-page-heading]:[color:#182137] [&.app-page-heading_>_.app-page-eyebrow]:[margin:0] [&.app-page-heading_>_.app-page-eyebrow]:[color:#68778e] [&.app-page-heading_>_.app-page-eyebrow]:[font-family:monospace] [&.app-page-heading_>_.app-page-eyebrow]:[font-size:14px] [&.app-page-heading_>_.app-page-eyebrow]:[font-weight:600] [&.app-page-heading_>_.app-page-eyebrow]:[line-height:1.5] [&.app-page-heading_>_.app-page-eyebrow]:[letter-spacing:.13em] [&.app-page-heading_>_.app-page-eyebrow]:[text-transform:uppercase] [&.app-page-heading_>_h1]:[margin:12px_0_0] [&.app-page-heading_>_h1]:[font-size:34px] [&.app-page-heading_>_h1]:[font-weight:600] [&.app-page-heading_>_h1]:[line-height:1.2] [&.app-page-heading_>_h1]:[letter-spacing:-.045em] [&.app-page-heading_>_h1]:[overflow-wrap:anywhere] [&.app-page-heading_>_.app-page-subtitle]:[margin:14px_0_0] [&.app-page-heading_>_.app-page-subtitle]:[color:#687087] [&.app-page-heading_>_.app-page-subtitle]:[font-size:14px] [&.app-page-heading_>_.app-page-subtitle]:[line-height:1.8] [@media_(max-width:700px)]:[&.app-page-heading]:[margin-bottom:26px] [@media_(max-width:700px)]:[&.app-page-heading_>_h1]:[font-size:30px]"}>
    <p className="app-page-eyebrow">{eyebrow}</p>
    <h1 id={id}>{title}</h1>
    {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
  </header>;
}
