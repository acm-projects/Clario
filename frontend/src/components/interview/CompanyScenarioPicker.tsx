import DOMPurify from "dompurify";
import CompanyLogo from "../ui/CompanyLogo";
import { brandFor } from "../../lib/companyBrands";
import type { Scenario, ScenarioSummary } from "../../lib/api";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-[#e3f0e6] text-[#24623f]",
  medium: "bg-[#fff1cb] text-[#78540c]",
  hard: "bg-[#fbe9eb] text-[#a72d39]",
};

function DifficultyPill({ difficulty }: { difficulty: string | null | undefined }) {
  if (!difficulty) return null;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${DIFFICULTY_STYLES[difficulty.toLowerCase()] ?? "bg-[#eef0f4] text-[#4b505c]"}`}>{difficulty}</span>;
}

export interface CompanyScenarioPickerProps {
  /** Companies shown as logo tiles. */
  featured: string[];
  /** Every company for the browse dropdown. */
  availableCompanies: string[];
  company: string;
  onCompany: (name: string) => void;
  /** All loaded scenarios (null while loading), used for per-company counts. */
  allScenarios: ScenarioSummary[] | null;
  companyScenarios: ScenarioSummary[];
  scenarioError: string | null;
  onRetry: () => void;
  scenarioSlug: string;
  onScenario: (slug: string) => void;
  scenarioLoading: boolean;
  previewError: string | null;
  scenario: Scenario | null;
  generating: boolean;
  onGenerate: () => void;
}

export default function CompanyScenarioPicker(props: CompanyScenarioPickerProps) {
  const { featured, availableCompanies, company, onCompany, allScenarios, companyScenarios, scenarioError, onRetry,
    scenarioSlug, onScenario, scenarioLoading, previewError, scenario, generating, onGenerate } = props;
  const countFor = (name: string) => (allScenarios ?? []).filter(item => item.company.toLowerCase().trim() === name.toLowerCase()).length;
  const brand = brandFor(company);

  return <div className="mt-6 grid gap-8">
    <section aria-labelledby="company-tiles-heading">
      <h3 id="company-tiles-heading" className="text-sm font-semibold text-[#182137]">Featured companies</h3>
      <div role="group" aria-label="Choose a company" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {featured.map(name => {
          const active = name.toLowerCase() === company.toLowerCase();
          const count = countFor(name);
          return <button key={name} type="button" aria-pressed={active} onClick={() => onCompany(name)}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${active ? "border-[#3054ed] bg-white shadow-[0_14px_30px_-24px_#3054ed]" : "border-[#ece9e1] bg-white/60 hover:border-[#c9d3fb]"}`}>
            <CompanyLogo company={brandFor(name)} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{name}</span>
              <span className="block text-xs text-[#687087]">{allScenarios === null ? "Loading..." : count === 1 ? "1 scenario" : `${count} scenarios`}</span>
            </span>
          </button>;
        })}
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl bg-[#f6f4ee] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Browse companies</span>
          <select className="min-h-11 rounded-xl border border-[#d9d6cc] bg-white px-3 text-sm" value={company} onChange={event => onCompany(event.target.value)}>
            {availableCompanies.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <button type="button" disabled={generating} onClick={onGenerate}
          className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-[#3054ed] px-4 text-sm font-semibold text-white transition hover:bg-[#2543ca] disabled:opacity-70">
          {generating ? "Preparing scenario..." : "Find or generate a company scenario"}<span aria-hidden="true">&#8594;</span>
        </button>
      </div>
    </section>

    <section aria-labelledby="scenario-list-heading">
      <div className="flex items-center gap-3">
        <CompanyLogo company={brand} size="xs" />
        <h3 id="scenario-list-heading" className="text-sm font-semibold">{company} scenarios</h3>
      </div>
      <div className="mt-3">
        {scenarioError ? <div role="alert" className="rounded-2xl bg-[#fff0d7] p-4 text-sm text-[#76501e]"><p>{scenarioError}</p><button type="button" className="mt-2 font-medium underline" onClick={onRetry}>Retry</button></div>
          : allScenarios === null ? <p role="status" className="text-sm text-[#687087]">Loading company scenarios...</p>
          : companyScenarios.length ? <div role="group" aria-label="Choose a scenario" className="grid gap-3 md:grid-cols-2">
            {companyScenarios.map(item => {
              const active = item.slug === scenarioSlug;
              return <button key={item.slug} type="button" aria-pressed={active} onClick={() => onScenario(item.slug)}
                className={`flex items-start justify-between gap-3 rounded-2xl border-2 p-4 text-left transition ${active ? "border-[#3054ed] bg-[#f4f6ff]" : "border-[#ece9e1] bg-white hover:border-[#c9d3fb]"}`}>
                <span className="min-w-0">
                  <span className="block font-medium leading-snug">{item.title}</span>
                  <span className="mt-1 block text-xs text-[#687087]">Coding scenario &middot; inspired by {item.company}</span>
                </span>
                <DifficultyPill difficulty={item.difficulty} />
              </button>;
            })}
          </div>
          : <div className="rounded-2xl border border-dashed border-[#d9d6cc] p-5 text-sm text-[#687087]">No saved scenarios for {company} yet. Use <span className="font-medium text-[#182137]">Find or generate a company scenario</span> to create one.</div>}
      </div>
    </section>

    {(scenarioLoading || previewError || scenario) && <section aria-label="Scenario preview" className="overflow-hidden rounded-[24px] border border-[#e4e2db] bg-white">
      {scenarioLoading && <p role="status" className="p-5 text-sm text-[#687087]">Loading your scenario...</p>}
      {previewError && <p role="alert" className="p-5 text-sm text-[#a72d39]">{previewError}</p>}
      {scenario && <>
        <div className="flex flex-wrap items-center gap-4 border-b border-[#ece9e1] bg-[#f6f4ee] px-5 py-4">
          <CompanyLogo company={brandFor(scenario.company)} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] font-semibold tracking-[.16em] text-[#3054ed]">{scenario.company.toUpperCase()} &middot; SCENARIO</p>
            <h3 className="mt-0.5 text-xl font-semibold tracking-tight">{scenario.title}</h3>
          </div>
          <DifficultyPill difficulty={scenario.difficulty} />
        </div>
        <div className="prose-sm max-h-[420px] overflow-y-auto px-5 py-4 text-sm leading-7 text-[#3d4456] [&_code]:rounded [&_code]:bg-[#f3f1eb] [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#f3f1eb] [&_pre]:p-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(scenario.prompt) }} />
      </>}
    </section>}
  </div>;
}
