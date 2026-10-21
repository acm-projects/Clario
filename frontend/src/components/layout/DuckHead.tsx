export default function DuckHead({ className = "" }: { className?: string }) {
  return <span className={"relative block aspect-square shrink-0 overflow-hidden " + className} aria-hidden="true">
    <img src={import.meta.env.BASE_URL + "duckhead.png"} alt="" className="pointer-events-none h-full w-full object-contain select-none" />
  </span>;
}
