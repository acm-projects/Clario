import { useEffect, useRef, useState } from "react";
import type { DuckPose } from "../../hooks/useDuckState";
const art:Partial<Record<DuckPose,string>> = { idle:"smartduck.png", thinking:"smartduck.png", celebrating:"excitedduck.png", confused:"stressedduck.png" };
export function Duck({pose="idle",size="md"}:{pose?:DuckPose;size?:"xs"|"sm"|"md"|"lg"|"xl"}) {
 const [previous,setPrevious]=useState<DuckPose|null>(null);const last=useRef(pose);
 useEffect(()=>{if(last.current===pose)return;setPrevious(last.current);last.current=pose;const id=setTimeout(()=>setPrevious(null),400);return()=>clearTimeout(id)},[pose]);
 return <span className={"ui-duck ui-duck-"+size} role="img" aria-label={"Clario duck, "+pose} data-pose={pose}>
 {previous&&<img className="ui-duck-previous" src={import.meta.env.BASE_URL+(art[previous]??"smartduck.png")} alt=""/>}
 <img key={pose} className="ui-duck-current" src={import.meta.env.BASE_URL+(art[pose]??"smartduck.png")} alt=""/>
 {!art[pose]&&<span className="ui-duck-placeholder">{pose}</span>}
 </span>;
}
// TODO artwork: listening, speaking, sleeping. Base duck and visible pose label are intentional placeholders.
