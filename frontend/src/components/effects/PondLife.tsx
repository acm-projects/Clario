import type { CSSProperties } from "react";
import "./pond-life.css";
export default function PondLife() {
return <div className="pond-life" aria-hidden="true">
<div className="pond-duck"><img src={import.meta.env.BASE_URL + "excitedduck.png"} alt="" /></div>
<div className="pond-computer"><svg viewBox="0 0 80 60" fill="none"><rect x="13" y="5" width="54" height="36" rx="5" fill="#edf6ff" stroke="#315b7c" strokeWidth="3"/><path d="M7 43h66l5 8H2Z" fill="#adcce9" stroke="#315b7c" strokeWidth="3"/><path d="m31 17-6 6 6 6m18-12 6 6-6 6m-7-15-5 18" stroke="#3683be" strokeWidth="2.5"/></svg></div>
{Array.from({length:10},(_,i)=><span key={i} className="pond-bubble" style={{left:(6+i*9)+"%","--delay":(-i*2.7)+"s","--size":(7+i%4*4)+"px"} as CSSProperties}/>)}
{[0,1,2].map(i=><svg key={i} className={"pond-fish pond-fish-"+i} viewBox="0 0 64 32"><path d="M45 16 61 4v24ZM47 16C35-4 8 1 3 16c5 15 32 20 44 0" fill={i===1?"#f7cf85":"#dceaff"}/><circle cx="14" cy="12" r="2" fill="#315b7c"/></svg>)}
</div>;
}
