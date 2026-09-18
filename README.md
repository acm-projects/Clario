<p align="center">
  <img src="https://media.tenor.com/B9gsrz2zMIoAAAAM/skills-interview.gif" alt="Gif" width="200">
</p>

# Clario 🎙️
An AI interviewer that catches your wrong turns before the real one does.

Clario is an AI voice interview coach that simulates a live technical interviewer: it asks questions, follows up based on your responses, and adapts the interview as it progresses. You solve problems in a built-in coding environment while explaining your thinking out loud, and Clario grades your reasoning and communication, not just your final code. After each session, it breaks down your performance, tracks progress over time, and builds a personalized study plan.

## ✨ Why Clario?
Most people know how to solve LeetCode problems, but the minute they're asked to reason out loud, explain their approach, and handle a follow-up under pressure, things fall apart. Most interview prep doesn't train for that. It either grades your final submitted solution or requires another human on the other end. Clario solves this by:

- Listening in real time, not just grading what you submit at the end
- Adapting follow-up questions to how you're actually reasoning through the problem
- Tracking communication (pace, filler words, silence, planning time) alongside code correctness
- Interjecting when you're going down a wrong approach, the way a real interviewer would
- Turning every session into a study plan for what to practice next

## MVP 🏆
- AI Voice Interviewer: realistic mock interviews through natural voice conversation with adaptive follow-ups
- Live Coding Workspace: in-browser editor where you solve problems while thinking out loud
- Interview Modes: Practice, Full Mock, Custom, and Company-Specific
- Interview Intelligence: analyzes communication, reasoning, planning time, silence, and coding behavior
- Personalized Feedback Report: coding correctness, communication, reasoning, and overall performance
- Interview Problem Library: searchable, filterable by topic/difficulty/role/company
- Progress Dashboard: long-term trends, strengths, weaknesses, improvement over time
- Communication & Confidence Analysis: pace, filler words, hesitation, clarity
- Personalized Study Plan: recommends what to practice next based on performance

## Stretch Goals 💪
- Interview Replay & Timeline: replay key moments with timestamped insights
- Adaptive Study Plan: multi-week plan that evolves as you improve

## Timeline 📆
 
| Week | Date / Event | Frontend | Backend |
|---|---|---|---|
| 1 | **Sept 9-15 - Build Night 1** | Read through the README, icebreaker, then go home and brainstorm features/ideas | Read through the README, icebreaker, then go home and brainstorm features/ideas |
| 2 | **Sept 16-22 - Design Day + Build Night 2** | Whiteboard to finalize features + site structure; begin wireframing; set up local dev environment off the existing repo; build static layout components off wireframes (navbar, session cards) | Research needed APIs (voice AI, Piston, LeetCode wrapper, etc); decide on company-tagged question source and confirm data format; flag Piston/Docker as a known trouble spot to test early; finalize DB schema (include `company` field on problems table); set up Supabase project + Auth |
| 3 | **Sept 23-29 - Build Night 3** | Build Signup/Login pages, connect to Supabase Auth | Implement auth verification in FastAPI; start voice pipeline spike (Hume EVI + Claude as CLM + TTS round trip), feeding the **AI Voice Interviewer** MVP |
| 4 | **Sept 30-Oct 6 - Build Night 4** | Embed Monaco Editor; build problem/session UI skeleton, feeding the **Live Coding Workspace** MVP | Set up Piston Docker sandbox; build problems table + CRUD endpoints; confirm code execution round-trip works |
| 5 | **Oct 7-13 - Build Night 5** | Build Interview Room UI: audio controls, transcript display, Monaco side-by-side | Build interviewer state machine (intro → problem → coding → wrap-up); wire system prompt to Claude; test adaptive follow-ups |
| 6 | **Oct 14-20 - Build Night 6 + Mid-Semester Review** | Build mode selection UI (Practice/Full Mock/Custom/Company-Specific); build Problem Library search/filter UI with company filter, feeding the **Interview Modes** + **Interview Problem Library** MVPs | Add mode field + prompt variants per mode; integrate LeetCode API wrapper and import company-tagged question set (company, difficulty, frequency) to populate problem library. **Review demo:** working voice interview + coding workspace end to end |
| 7 | **Oct 21-27 - Build Night 7 + End of Semester Review** | Polish Interview Room based on Week 6 feedback; start Feedback Report UI shell | Build transcript_events + code_snapshots logging pipeline; build Celery job computing silence, planning time, pace, filler words, feeding the **Interview Intelligence** MVP |
| 8 | **Oct 28-Nov 3 - Build Night 8** | Build Feedback Report UI, Communication Analysis view, feeding the **Personalized Feedback Report** + **Communication & Confidence Analysis** MVPs | Build Claude-based Feedback Report generation; wire Communication Analysis metrics into report |
| 9 | **Nov 4-10 - Build Night 9** | Build Progress Dashboard (Recharts), Study Plan display, feeding the **Progress Dashboard** + **Personalized Study Plan** MVPs | Build dashboard aggregation endpoints; build Study Plan generation job |
| 10 | **Nov 11-17 - Build Night 10** | Full end-to-end pass on every MVP screen, fix broken connections, freeze new features | Full end-to-end pass on every MVP endpoint, fix broken connections, freeze new features |
| 11 | **Nov 18-24 - Mock Presentations** | Present working demo, take feedback, log bugs to fix | Present working demo, take feedback, log bugs to fix |
| 12 | **Nov 25-Dec 2 - Thanksgiving Break + Presentation Night** | Only fix bugs surfaced at Mock Presentations, no new features; final rehearsal, timing check, present on Dec 2 | Only fix bugs surfaced at Mock Presentations, no new features; final rehearsal, timing check, present on Dec 2 |

## 🛠️ Tech Stack

### Frontend
- React + TypeScript
- Tailwind CSS
- Figma (UI/UX design)

### Backend
- FastAPI (Python)
- Supabase (Postgres)
- Celery + Redis (background jobs)

### Voice AI
- Hume EVI (voice interface, turn-taking, emotion-aware speech)
- Claude API as CLM (custom language model powering Hume EVI's responses)

### AI & APIs
- Claude API (interviewer logic, feedback reports, study plans)
- Piston API (code execution sandbox)
- LeetCode API wrapper (problem library)

### Tools
- GitHub
- VS Code
- Postman

## 📚 Clario Learning Resources
To go from zero to building Clario.

### Frontend (React, TypeScript, Tailwind, Figma)
- [React JS Crash Course](https://www.youtube.com/watch?v=w7ejDZ8SWv8) - Components, state, props, and building UI.
- [TypeScript for Beginners](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) - Add type safety to your React components.
- [Tailwind CSS V4 Crash Course](https://www.youtube.com/watch?v=H_kSd4kn0E8) - Utility-first CSS for fast, consistent styling.
- [Figma Crash Course for Beginners (2026)](https://www.youtube.com/watch?v=1SNZRCVNizg) - Wireframing and UI design, needed for Design Day.

### Backend (FastAPI, Supabase, Auth)
- [FastAPI Crash Course](https://www.youtube.com/watch?v=8TMQcRcBnW8) - Routes, request bodies, CRUD endpoints.
- [Supabase React Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react) - Official guide to Supabase Auth, Database, and Storage.
- [Implementing Supabase Auth in FastAPI](https://phillyharper.medium.com/implementing-supabase-auth-in-fastapi-63d9d8272c7b) - Wiring Supabase Auth into a FastAPI backend, the exact combo Clario uses.

### Voice AI (Hume EVI + Claude as CLM)
- [What is WebRTC? (3 min explainer)](https://www.youtube.com/results?search_query=what+is+webrtc) - Background on the real-time audio connection voice AI relies on.
- [Hume EVI TypeScript Quickstart](https://dev.hume.ai/docs/empathic-voice-interface-evi/quickstart/typescript) - Authenticate, connect, capture and play back audio with EVI.
- [Hume EVI Custom Language Model Guide](https://dev.hume.ai/docs/speech-to-speech-evi/guides/custom-language-model) - How to route EVI's responses through Claude instead of Hume's default model.
- [How to Create a Custom LLM Integration with Hume's EVI](https://www.youtube.com/watch?v=uOo7qTCleT4) - Walkthrough of wiring a custom language model into EVI.

### AI / LLM Integration (Claude API)
- [Claude API Basics](https://docs.claude.com/en/docs/intro) - Making your first API calls.
- [Prompt Engineering Basics](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview) - Structuring prompts for the interviewer logic, feedback reports, and study plans.

### Live Coding Workspace (Monaco Editor + Piston)
- [@monaco-editor/react docs](https://github.com/suren-atoyan/monaco-react) - Embed the VS Code editor engine in React.
- [Piston API docs](https://piston.readthedocs.io/en/latest/api-v2/) - Sandboxed code execution; benchmark this early since Piston/Docker is a known trouble spot.

### Interview Problem Library (LeetCode API wrappers)
- [leetcode-query](https://github.com/JacobLinCool/LeetCode-Query) - TypeScript wrapper, actively maintained, pulls problems by difficulty/tag.
- [alfa-leetcode-api](https://github.com/alfaarghya/alfa-leetcode-api) - Hosted REST wrapper if you'd rather not write GraphQL queries yourself.

### Interview Intelligence (Celery + Redis background jobs)
- [Background Tasks with FastAPI + Celery + Redis](https://testdriven.io/blog/fastapi-and-celery/) - Run silence/pace/filler-word computation without blocking the live interview.

### Progress Dashboard (Recharts)
- [Recharts Crash Course](https://recharts.org/en-US/guide) - Chart components for visualizing performance trends.

### General Tools
- [Git & GitHub Crash Course 2025](https://www.youtube.com/watch?v=vA5TTz6BXhY) - Core commands, branching, pull requests.
- [VS Code](https://code.visualstudio.com/docs) - IDE setup and extensions.
- [Postman](https://learning.postman.com/docs/getting-started/overview/) - Testing API endpoints as you build them.

## ✅ Suggested Learning Path

1. TypeScript basics (if new to it) → React → Tailwind → Figma, so you can whiteboard and wireframe on Design Day
2. FastAPI → Supabase (Postgres + Auth), to get the DB schema and login flow working
3. WebRTC basics → Hume EVI quickstart → Claude as a Custom Language Model, for the voice pipeline spike (tackle this early, it's the highest-risk piece)
4. Monaco Editor → Piston API, for the Live Coding Workspace
5. Claude API prompting, for the interviewer state machine and adaptive follow-ups
6. LeetCode API wrapper, to populate the Interview Problem Library
7. Celery + Redis, for the Interview Intelligence background jobs (silence, pace, filler words)
8. Claude API again, for Feedback Report and Study Plan generation
9. Recharts, for the Progress Dashboard
10. Optional throughout: Git/GitHub and Postman to keep the team's workflow clean

## Git Commands 🤖
| Command | What it does |
|---|---|
| `git branch` | lists all the branches |
| `git branch "branch name"` | makes a new branch |
| `git checkout "branch name"` | switches to specified branch |
| `git add .` | finds all changed files |
| `git commit -m "message"` | commit with a message |
| `git push` | push to branch |
| `git pull "branch"` | pull updates from a specific branch |

## Team Clario 🎙️

**Developers 👩‍💻** 
- Asritha Pinnamaneni
- Prapti Singh
- Sahasra Bezawada
- Vrinda Murugesh 🤗

**Project Manager 👩‍💼**
- Ankitha Shaji Thomas ❤️

**Industry Mentor 🧑‍🏫**
- Adarsh Goura
