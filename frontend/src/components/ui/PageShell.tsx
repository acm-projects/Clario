import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
export function PageShell({children,mode="work",className=""}:{children:ReactNode;mode?:"work"|"home";className?:string}){return <main className={"ui-page app-sidebar-layout ui-mode-"+mode+" "+className}><Sidebar/><div className="ui-content">{children}</div></main>}
