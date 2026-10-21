import { useState } from "react";
export type DuckPose="idle"|"listening"|"thinking"|"speaking"|"celebrating"|"confused"|"sleeping";
export interface DuckSignals { userSpeaking?:boolean; processing?:boolean; aiSpeaking?:boolean; completed?:boolean; personalBest?:boolean; error?:boolean; empty?:boolean }
export function resolveDuckPose(s:DuckSignals):DuckPose { return s.error?"confused":s.completed||s.personalBest?"celebrating":s.processing?"thinking":s.aiSpeaking?"speaking":s.userSpeaking?"listening":s.empty?"sleeping":"idle"; }
export function useDuckState(signals:DuckSignals={}) { const [override,setPose]=useState<DuckPose|null>(null);return {pose:override??resolveDuckPose(signals),setPose}; }
