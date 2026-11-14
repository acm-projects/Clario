import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const source = readFileSync(new URL('../src/components/interview/ReportDetails.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const { default: ReportDetails } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const report = {
 details: {
  verdict: 'Explain your plan.', sectors: {},
  umpire: [{ step: 'Understand', status: 'okay', summary: 'Clarified an input.', did_well: 'Asked about empty input.', improve: 'Ask about bounds.', evidence: [{ transcript_id: 'turn-1', observation: 'Asked about input.', effect: 'raised' }] }],
  moments: [{ moment_id: 'filler-1', context: 'Before the plan.', suggested_fix: 'Pause, then state the plan.' }],
  fix_first: [{ habit: 'Narrate the plan.', drill: 'Explain two steps before your next three solutions.' }],
  dont_worry: ['One filler.'], specific_strengths: [],
 },
 session_evidence: {
  transcript: [{ id: 'turn-1', speaker: 'user', seconds: 65, text: 'Um, empty input?' }],
  measured_moments: [{ id: 'filler-1', kind: 'filler', seconds: 65, duration_seconds: null, count: 1, transcript_id: 'turn-1' }],
  filler_total: 1, filler_rate_per_interview_minute: 0.5, silence_available: false,
 },
};
test('report renders coaching and transcript links point to visible passage anchors', () => {
 const html = renderToStaticMarkup(React.createElement(ReportDetails, { report }));
 for (const text of ['Your UMPIRE breakdown', 'Fix first', 'Don’t worry about', '1:05', 'Narrate the plan.', 'href="#transcript-turn-1"', 'id="transcript-turn-1"', 'Pause, then state the plan.']) assert.ok(html.includes(text), text);
 assert.ok(!html.includes('NaN'));
});
test('previously saved silence moments are hidden', () => {
 const quiet = structuredClone(report);
 quiet.session_evidence.silence_available = true;
 Object.assign(quiet.session_evidence.measured_moments[0], { kind: 'silence', duration_seconds: 42, count: null });
 const html = renderToStaticMarkup(React.createElement(ReportDetails, { report: quiet }));
 assert.ok(!html.includes('42s quiet'));
 assert.ok(!html.includes('Before the plan.'));
 assert.ok(!html.includes('Timestamped silence was not recorded'));
});
