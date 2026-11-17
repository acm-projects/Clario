# Clario UI colors and fonts

Source audit: 2026-11-03. This is a static inventory of frontend source, not a pixel-by-pixel runtime capture. Theme/variant/opacity rules determine the actual rendered color. Images, video frames and inherited third-party Monaco defaults are not enumerated.

Scanned 104 source/HTML files; 70 are reachable through static app imports. Found 367 distinct explicit/resolved color expressions in reachable source. The CSV also includes declared colors in source files outside that graph. Role labels are inferred from nearby declarations; source file/line is authoritative.

## Main active product palette

The brandTheme wrapper in frontend/src/lib/theme.ts overrides several root defaults. The main page background is #FBF4DF; #2378DB/#12354C are older root defaults, not the main product brand overrides.

| UI role | Color |
|---|---|
| Page background | `#FBF4DF` |
| Card / input surface | `#FFFDF8` |
| Primary action / link | `#3054ED` |
| Primary hover | `#2543CA` |
| Banner gradient end | `#263DAE` |
| Yellow action / highlight | `#FFDF4F` |
| Yellow hover | `#FFE879` |
| Main text / sidebar | `#182137` |
| Muted text | `#687087` |
| Border | `#E4E2DB` |
| Strong border | `#A9AFBF` |
| Selected / light blue surface | `#E9EDFF` |
| Inset surface | `#EEECE5` |
| Sidebar selected surface | `#27324E` |
| Sidebar muted text | `#AEB8D2` |
| Sidebar border | `#2D3650` |
| Easy / success background | `#E3F0E6` |
| Easy / success text | `#24623F` |
| Medium / warning background | `#FFF1CB` |
| Medium / warning text | `#78540C` |
| Hard / error background | `#FBE9EB` |
| Hard / error text | `#A72D39` |
| System Design panel border | `#C5C8CE` |
| System Design self-video surface | `#F5F0E3` |

## Gradients

- Cream: `linear-gradient(135deg, #FFFDF7 0%, #FBF4DF 50%, #F2E5C4 100%)`.
- Ducky/Assessment blue banner: `linear-gradient(115deg, #3054ED, #263DAE)` (some panels use 150deg).
- Dark workspace: `linear-gradient(135deg, #10192C, #151E33 55%, #1C2540)`.

## Dark workspace palette

| UI role | Color |
|---|---|
| Page gradient start / base | `#10192C` |
| Page gradient middle | `#151E33` |
| Page gradient end | `#1C2540` |
| Raised surface | `#1B263C` |
| Inset surface | `#121D31` |
| Blue surface | `#26365B` |
| Main text | `#EDF1FB` |
| Muted text | `#AAB7D0` |
| Border | `#35415A` |
| Strong border | `#647493` |
| Easy background / text | `#173A2C / #92E7B6` |
| Medium background / text | `#3A3217 / #F0CF76` |
| Hard background / text | `#3A1C20 / #FFA2AC` |

## Interview and editor palette

| UI role | Color |
|---|---|
| Dark interview page | `#0A1120` |
| Dark panels/editor | `#0F1A2E` |
| Light interview page | `#FBF4DF` |
| Light interview panels (skin override) | `#FFFDF7` |
| Light Monaco editor | `#FFFCF4` |
| Interview header / skin accent | `#627BE8` |
| Dark main text | `#F4F7FC` |
| Dark body text | `#C3CDE0` |
| Dark muted text | `#8A97AD` |
| Editor light text | `#173153` |
| Editor dark text | `#E2EBFA` |
| Editor dark keyword/cursor | `#FAC52E` |

## Fonts

| Font | Use | Loading / notes |
|---|---|---|
| DM Sans | Main product UI: pages, cards, forms, buttons, navigation; font-sans and font-detail | Loaded from Google Fonts: 400, 500, 600, 700, 800 |
| Inter | Landing-page navigation, paragraphs, buttons, captions and footer via local --font-detail | Loaded from Google Fonts: 400, 500, 600, 700 |
| JetBrains Mono | Declared for code, timers/numeric elements and Monaco editors | Requested in CSS/editor options; not downloaded by frontend/index.html and no local font asset found |
| Generic monospace | Explicit small labels/eyebrows, timers and some technical UI | Browser/OS monospace; also fallback for code |
| Anton | Declared as font-headline, but no font-headline usage found in app source | Loaded from Google Fonts; no active component usage found |
| Fredoka | No component/font-family usage found | Loaded from Google Fonts: 400, 500, 600, 700; currently unused |
| System fallbacks | system-ui, sans-serif, Cascadia Code, ui-monospace, Menlo, Consolas, monospace | Used when the preferred named font is unavailable |

Generic font declarations are browser-dependent. A declared JetBrains Mono stack does not prove it is installed on a particular machine.

## Complete reachable-source color inventory

Hex is normalized to uppercase; 3/4-digit hex is expanded. Eight-digit hex uses the last two digits as alpha. Tailwind named palettes are resolved from the installed Tailwind theme (often OKLCH); opacity variants retain their color-mix expression.

| Color / CSS expression | Occurrences | Roles | Example source locations |
|---|---:|---|---|
| `#000` | 3 | border | frontend/src/pages/Landing.tsx:186; frontend/src/pages/Landing.tsx:190; frontend/src/pages/Landing.tsx:191 |
| `#000000` | 3 | background | frontend/src/pages/Landing.tsx:218; frontend/src/pages/Landing.tsx:223; frontend/src/pages/Landing.tsx:228 |
| `#00000000` | 2 | literal / token | frontend/src/lib/editorThemes.ts:24; frontend/src/lib/editorThemes.ts:57 |
| `#08112B66` | 1 | shadow | frontend/src/components/dashboard/DashboardTour.tsx:73 |
| `#08734D` | 1 | text / foreground | frontend/src/components/interview/ProblemPanel.tsx:25 |
| `#0A1120` | 5 | background, literal / token | frontend/src/components/interview/InterviewPage.tsx:144; frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/components/ui/ProblemLoading.tsx:4; frontend/src/pages/RepoDebugging.tsx:19 |
| `#0C1626` | 2 | literal / token, text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/pages/RepoDebugging.tsx:19 |
| `#0C1A30` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#0F1A2E` | 6 | background, literal / token, text / foreground | frontend/src/components/interview/CodePanel.tsx:49; frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/lib/editorThemes.ts:21; frontend/src/pages/RepoDebugging.tsx:19 |
| `#10192C` | 4 | background, literal / token | frontend/src/index.css:7; frontend/src/index.css:8; frontend/src/index.css:9; frontend/src/pages/Settings.tsx:82 |
| `#101A30` | 1 | background | frontend/src/components/ui/ProblemLoading.tsx:15 |
| `#101A35` | 2 | background, fill | frontend/src/components/dashboard/DashboardTour.tsx:69; frontend/src/pages/Settings.tsx:95 |
| `#111727` | 1 | background | frontend/src/pages/Landing.tsx:61 |
| `#121826` | 2 | text / foreground | frontend/index.html:2; frontend/index.html:12 |
| `#121D31` | 1 | literal / token | frontend/src/index.css:11 |
| `#122B50` | 3 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/components/interview/TopBar.tsx:54; frontend/src/components/interview/VideoCallPanel.tsx:232 |
| `#12354C` | 2 | background, text / foreground | frontend/src/index.css:30; frontend/src/index.css:78 |
| `#12354C0D` | 1 | shadow | frontend/src/components/ui/Sidebar.tsx:32 |
| `#12354C26` | 1 | shadow | frontend/src/index.css:94 |
| `#12354C38` | 1 | shadow | frontend/src/components/ui/Sidebar.tsx:32 |
| `#12354C40` | 2 | shadow | frontend/src/index.css:94; frontend/src/pages/Assessment.tsx:92 |
| `#147A72` | 1 | background | frontend/src/index.css:78 |
| `#151E33` | 1 | literal / token | frontend/src/index.css:8 |
| `#154E91` | 1 | literal / token | frontend/src/index.css:80 |
| `#16233B` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#173153` | 3 | text / foreground | frontend/src/lib/editorThemes.ts:49; frontend/src/lib/editorThemes.ts:55; frontend/src/pages/RepoDebugging.tsx:19 |
| `#173A2C` | 2 | background | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/index.css:72 |
| `#182137` | 104 | background, border, literal / token, outline, stroke, text / foreground | frontend/src/components/auth/AuthLayout.tsx:15; frontend/src/components/dashboard/DashboardTour.tsx:66; frontend/src/components/interview/InterviewModeGrid.tsx:5; frontend/src/components/interview/InterviewModeGrid.tsx:6 |
| `#1821370D` | 1 | shadow | frontend/src/components/interview/sandbox-skin.css:34 |
| `#18213710` | 1 | shadow | frontend/src/pages/ProblemLibrary.tsx:104 |
| `#18213720` | 1 | shadow | frontend/src/lib/theme.ts:7 |
| `#18213725` | 3 | shadow | frontend/src/pages/Dashboard.tsx:23; frontend/src/pages/Login.tsx:88; frontend/src/pages/Signup.tsx:115 |
| `#18213726` | 1 | shadow | frontend/src/index.css:367 |
| `#18213730` | 3 | shadow | frontend/src/components/interview/InterviewModeGrid.tsx:35; frontend/src/lib/theme.ts:7; frontend/src/pages/Assessment.tsx:87 |
| `#18213735` | 2 | shadow | frontend/src/components/interview/InterviewModeGrid.tsx:35; frontend/src/pages/Settings.tsx:57 |
| `#18213740` | 1 | shadow | frontend/src/pages/Landing.tsx:49 |
| `#191D20` | 3 | literal / token, outline, text / foreground | frontend/src/components/auth/ProfileGate.tsx:69; frontend/src/components/dashboard/InterviewCalendar.tsx:51; frontend/src/index.css:84 |
| `#192840` | 1 | literal / token | frontend/src/lib/editorThemes.ts:23 |
| `#1A2842` | 2 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/pages/RepoDebugging.tsx:19 |
| `#1B263C` | 1 | literal / token | frontend/src/index.css:10 |
| `#1C2540` | 1 | literal / token | frontend/src/index.css:8 |
| `#1C3D73` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#1C63B5` | 1 | literal / token | frontend/src/index.css:80 |
| `#1D2D3C` | 1 | literal / token | frontend/src/index.css:82 |
| `#202B42` | 1 | border | frontend/src/components/interview/CodePanel.tsx:49 |
| `#221155` | 2 | background, text / foreground | frontend/src/pages/Landing.tsx:72; frontend/src/pages/RepoDebugging.tsx:161 |
| `#22345A` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#2378DB` | 17 | background, border, literal / token, ring, text / foreground | frontend/src/components/dashboard/InterviewCalendar.tsx:28; frontend/src/components/dashboard/InterviewCalendar.tsx:34; frontend/src/components/dashboard/InterviewCalendar.tsx:51; frontend/src/components/dashboard/InterviewCalendar.tsx:56 |
| `#2378DB60` | 1 | shadow | frontend/src/pages/Landing.tsx:91 |
| `#242C32` | 1 | literal / token | frontend/src/index.css:84 |
| `#24324B` | 1 | background | frontend/src/index.css:35 |
| `#24623F` | 3 | literal / token, text / foreground | frontend/src/index.css:83; frontend/src/pages/ProblemLibrary.tsx:26; frontend/src/pages/Recommended.tsx:15 |
| `#25334D` | 1 | background | frontend/src/pages/Settings.tsx:82 |
| `#253550` | 1 | background | frontend/src/lib/editorThemes.ts:31 |
| `#254268` | 1 | text / foreground | frontend/src/pages/RepoDebugging.tsx:19 |
| `#2543CA` | 4 | background, literal / token, text / foreground | frontend/src/lib/theme.ts:4; frontend/src/pages/Assessment.tsx:109; frontend/src/pages/Landing.tsx:192; frontend/src/pages/RepoDebugging.tsx:19 |
| `#26365B` | 1 | literal / token | frontend/src/index.css:12 |
| `#263DAE` | 2 | background | frontend/src/pages/Assessment.tsx:87; frontend/src/pages/ProblemLibrary.tsx:96 |
| `#2644BF` | 1 | background | frontend/src/pages/Landing.tsx:222 |
| `#27324E` | 1 | literal / token | frontend/src/lib/theme.ts:8 |
| `#29251D` | 1 | text / foreground | frontend/src/pages/Feedback.tsx:51 |
| `#292929` | 2 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/index.css:362 |
| `#293FB7` | 1 | literal / token | frontend/src/lib/theme.ts:6 |
| `#2946B6` | 1 | text / foreground | frontend/src/pages/Landing.tsx:56 |
| `#2946C5` | 4 | text / foreground | frontend/src/pages/Assessment.tsx:121; frontend/src/pages/Feedback.tsx:74; frontend/src/pages/Feedback.tsx:86; frontend/src/pages/Feedback.tsx:89 |
| `#2C5BA8` | 2 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#2CBE94` | 1 | background | frontend/src/pages/Dashboard.tsx:163 |
| `#2CBE9422` | 1 | shadow | frontend/src/pages/Dashboard.tsx:163 |
| `#2D3650` | 1 | border | frontend/src/lib/theme.ts:8 |
| `#2F6FD0` | 4 | background, border, ring | frontend/src/components/interview/ResizableSplit.tsx:63; frontend/src/components/interview/ResizableSplit.tsx:101; frontend/src/components/interview/VideoCallPanel.tsx:221 |
| `#304B9140` | 1 | shadow | frontend/src/pages/ProblemLibrary.tsx:96 |
| `#3054D6` | 1 | background | frontend/src/components/dashboard/DashboardTour.tsx:101 |
| `#3054ED` | 96 | background, border, literal / token, outline, shadow, text / foreground | frontend/src/components/auth/AssessmentGate.tsx:23; frontend/src/components/auth/AuthLayout.tsx:29; frontend/src/components/interview/InterviewModeGrid.tsx:4; frontend/src/components/interview/InterviewModeGrid.tsx:5 |
| `#3056A4` | 5 | text / foreground | frontend/src/lib/editorThemes.ts:43; frontend/src/lib/editorThemes.ts:44; frontend/src/lib/editorThemes.ts:45; frontend/src/lib/editorThemes.ts:51 |
| `#305ED1` | 3 | outline, stroke | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/components/interview/VideoCallPanel.tsx:194 |
| `#305ED133` | 1 | literal / token | frontend/src/lib/editorThemes.ts:29 |
| `#305ED166` | 1 | literal / token | frontend/src/lib/editorThemes.ts:28 |
| `#333D4F65` | 1 | shadow | frontend/src/pages/Landing.tsx:102 |
| `#34445E` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#34A853` | 2 | fill | frontend/src/pages/Login.tsx:218; frontend/src/pages/Signup.tsx:290 |
| `#35415A` | 1 | border | frontend/src/index.css:16 |
| `#3655D8` | 5 | background | frontend/src/pages/Landing.tsx:186; frontend/src/pages/Login.tsx:160; frontend/src/pages/Settings.tsx:75; frontend/src/pages/Settings.tsx:95 |
| `#397653` | 1 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#397AD5` | 1 | literal / token | frontend/src/index.css:87 |
| `#3A1C20` | 3 | background | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/index.css:74 |
| `#3A3217` | 3 | background | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/index.css:73 |
| `#3B8FE8` | 1 | background | frontend/src/components/auth/ProfileGate.tsx:69 |
| `#3B8FE830` | 1 | shadow | frontend/src/pages/Assessment.tsx:15 |
| `#3B8FE840` | 1 | shadow | frontend/src/pages/Assessment.tsx:14 |
| `#3F59AE` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#414A52` | 1 | background | frontend/src/pages/Landing.tsx:103 |
| `#426B39` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:46 |
| `#4285F4` | 2 | fill | frontend/src/pages/Login.tsx:213; frontend/src/pages/Signup.tsx:285 |
| `#454545` | 2 | literal / token, text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#4566ED` | 43 | background, border, fill, outline, ring, text / foreground | frontend/src/components/auth/AuthLayout.tsx:16; frontend/src/components/auth/AuthLayout.tsx:17; frontend/src/components/auth/AuthLayout.tsx:20; frontend/src/components/dashboard/DashboardTour.tsx:85 |
| `#4566ED40` | 2 | shadow | frontend/src/components/ui/ProblemLoading.tsx:10; frontend/src/pages/Dashboard.tsx:23 |
| `#46535D` | 1 | border | frontend/src/index.css:84 |
| `#477052` | 1 | text / foreground | frontend/src/pages/Feedback.tsx:88 |
| `#495362` | 2 | literal / token, text / foreground | frontend/src/pages/RepoDebugging.tsx:19 |
| `#4A8CF0` | 2 | background | frontend/src/components/interview/TopBar.tsx:62; frontend/src/components/interview/VideoCallPanel.tsx:244 |
| `#4ADE80` | 1 | background | frontend/src/components/interview/VideoCallPanel.tsx:22 |
| `#4B505C` | 19 | border, stroke | frontend/src/components/auth/AuthLayout.tsx:16; frontend/src/components/auth/AuthLayout.tsx:17; frontend/src/components/auth/AuthLayout.tsx:18; frontend/src/pages/Landing.tsx:100 |
| `#4BAF83` | 2 | text / foreground | frontend/src/pages/RepoDebugging.tsx:166 |
| `#4C6080` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:50 |
| `#4C68C4` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#4C83A3` | 1 | text / foreground | frontend/src/lib/feedback.ts:3 |
| `#4E90EE` | 3 | literal / token | frontend/src/components/effects/WaterWaves.tsx:15; frontend/src/index.css:87 |
| `#527DB5` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#53616C` | 1 | text / foreground | frontend/src/index.css:82 |
| `#55595C` | 9 | text / foreground | frontend/src/components/auth/ProfileGate.tsx:68; frontend/src/components/auth/ProfileGate.tsx:69; frontend/src/components/dashboard/InterviewCalendar.tsx:34; frontend/src/components/dashboard/InterviewCalendar.tsx:35 |
| `#55595C20` | 1 | shadow | frontend/src/pages/Landing.tsx:108 |
| `#5576EF` | 2 | literal / token | frontend/src/components/auth/AuthLayout.tsx:29; frontend/src/lib/theme.ts:6 |
| `#56617A` | 1 | border | frontend/src/lib/theme.ts:8 |
| `#58627B` | 6 | fill, text / foreground | frontend/src/index.css:31; frontend/src/pages/Dashboard.tsx:28; frontend/src/pages/Dashboard.tsx:30; frontend/src/pages/Dashboard.tsx:31 |
| `#587096` | 2 | literal / token, text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/pages/RepoDebugging.tsx:19 |
| `#5B6B87` | 1 | stroke | frontend/src/components/interview/VideoCallPanel.tsx:210 |
| `#626B7A` | 3 | text / foreground | frontend/src/pages/Landing.tsx:217; frontend/src/pages/Landing.tsx:222; frontend/src/pages/Landing.tsx:227 |
| `#626B80` | 2 | text / foreground | frontend/src/components/dashboard/DashboardTour.tsx:93; frontend/src/index.css:50 |
| `#626C86` | 1 | text / foreground | frontend/src/components/interview/sandbox-skin.css:12 |
| `#627BE8` | 1 | literal / token | frontend/src/components/interview/sandbox-skin.css:2 |
| `#647493` | 1 | border | frontend/src/index.css:17 |
| `#647DA6` | 1 | literal / token | frontend/src/lib/editorThemes.ts:32 |
| `#65748C` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:41 |
| `#666666` | 1 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#687087` | 66 | fill, text / foreground | frontend/src/components/dashboard/DashboardTour.tsx:100; frontend/src/components/interview/InterviewModeGrid.tsx:5; frontend/src/components/interview/InterviewModeGrid.tsx:6; frontend/src/components/ui/PageHeading.tsx:9 |
| `#68758F` | 1 | text / foreground | frontend/src/pages/Landing.tsx:64 |
| `#68778E` | 4 | text / foreground | frontend/src/components/ui/PageHeading.tsx:9; frontend/src/pages/InterviewSelection.tsx:110; frontend/src/pages/ProblemLibrary.tsx:112; frontend/src/pages/Recommended.tsx:68 |
| `#6C87EC` | 1 | background | frontend/src/pages/Landing.tsx:225 |
| `#6FA4EE` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#738098` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:58 |
| `#746329` | 1 | text / foreground | frontend/src/components/interview/InterviewModeGrid.tsx:7 |
| `#746630` | 1 | text / foreground | frontend/src/pages/Landing.tsx:217 |
| `#7585A4` | 1 | stroke | frontend/src/index.css:34 |
| `#76501E` | 2 | text / foreground | frontend/src/pages/InterviewSelection.tsx:111; frontend/src/pages/ProblemLibrary.tsx:100 |
| `#76D8B0` | 2 | background, text / foreground | frontend/src/components/ui/ProblemLoading.tsx:16; frontend/src/components/ui/ProblemLoading.tsx:19 |
| `#777A7C` | 12 | fill, text / foreground | frontend/src/components/dashboard/InterviewCalendar.tsx:32; frontend/src/components/dashboard/InterviewCalendar.tsx:41; frontend/src/components/dashboard/InterviewCalendar.tsx:56; frontend/src/index.css:50 |
| `#78540C` | 4 | literal / token, text / foreground | frontend/src/index.css:83; frontend/src/pages/ProblemLibrary.tsx:27; frontend/src/pages/Recommended.tsx:15; frontend/src/pages/SystemDesign.tsx:52 |
| `#78AAA2` | 1 | text / foreground | frontend/src/lib/feedback.ts:5 |
| `#7952B3` | 1 | text / foreground | frontend/src/pages/ProblemLibrary.tsx:23 |
| `#79A9FF` | 1 | background | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#79DFAC` | 1 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#7C898F` | 1 | border | frontend/src/index.css:82 |
| `#806A2B` | 2 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#809CF7` | 2 | literal / token | frontend/src/components/auth/AuthLayout.tsx:29; frontend/src/lib/theme.ts:6 |
| `#81898F` | 1 | text / foreground | frontend/src/pages/Landing.tsx:105 |
| `#8195C9` | 1 | border | frontend/src/components/ui/ProblemLoading.tsx:15 |
| `#8195ED` | 7 | background, border, outline, text / foreground | frontend/src/components/ui/ProblemLoading.tsx:21; frontend/src/pages/Settings.tsx:70; frontend/src/pages/Settings.tsx:80; frontend/src/pages/Settings.tsx:83 |
| `#8293B5` | 1 | text / foreground | frontend/src/components/ui/ProblemLoading.tsx:18 |
| `#8297BA` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:25 |
| `#84DFAE` | 1 | literal / token | frontend/src/index.css:18 |
| `#865B05` | 1 | text / foreground | frontend/src/components/interview/ProblemPanel.tsx:25 |
| `#8792A5` | 1 | text / foreground | frontend/src/pages/ProblemLibrary.tsx:103 |
| `#88221122` | 1 | literal / token | frontend/src/pages/Landing.tsx:214 |
| `#88221177` | 3 | literal / token | frontend/src/pages/Landing.tsx:213; frontend/src/pages/Landing.tsx:220; frontend/src/pages/ProblemLibrary.tsx:97 |
| `#88222266` | 2 | literal / token | frontend/src/pages/Dashboard.tsx:170; frontend/src/pages/InterviewSelection.tsx:109 |
| `#88224499` | 1 | background | frontend/src/components/dashboard/InterviewCalendar.tsx:39 |
| `#88225500` | 1 | background | frontend/src/components/dashboard/InterviewCalendar.tsx:39 |
| `#88559922` | 2 | text / foreground | frontend/src/pages/InterviewReport.tsx:61; frontend/src/pages/InterviewSelection.tsx:105 |
| `#88559944` | 10 | background, literal / token, text / foreground | frontend/src/components/interview/InterviewModeGrid.tsx:43; frontend/src/pages/Assessment.tsx:109; frontend/src/pages/Dashboard.tsx:174; frontend/src/pages/Dashboard.tsx:175 |
| `#88559999` | 5 | background, literal / token, text / foreground | frontend/src/pages/InterviewSelection.tsx:107; frontend/src/pages/Landing.tsx:193; frontend/src/pages/Landing.tsx:203; frontend/src/pages/Landing.tsx:234 |
| `#896000` | 3 | border, literal / token, text / foreground | frontend/src/lib/editorThemes.ts:42; frontend/src/lib/editorThemes.ts:59; frontend/src/lib/editorThemes.ts:67 |
| `#89836D` | 2 | text / foreground | frontend/src/pages/Feedback.tsx:80; frontend/src/pages/Feedback.tsx:92 |
| `#8990A0` | 1 | text / foreground | frontend/src/components/dashboard/DashboardTour.tsx:103 |
| `#8A6115` | 1 | text / foreground | frontend/src/pages/Feedback.tsx:88 |
| `#8A6B18` | 1 | text / foreground | frontend/src/pages/ProblemLibrary.tsx:22 |
| `#8A7753` | 1 | text / foreground | frontend/src/pages/Landing.tsx:220 |
| `#8A97AD` | 2 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/pages/RepoDebugging.tsx:19 |
| `#8B8C91` | 1 | text / foreground | frontend/src/pages/Landing.tsx:230 |
| `#8B9FF0` | 2 | border, text / foreground | frontend/src/components/ui/ProblemLoading.tsx:8; frontend/src/components/ui/ProblemLoading.tsx:12 |
| `#8BBEF2` | 1 | fill | frontend/src/pages/Dashboard.tsx:215 |
| `#8C95A9` | 1 | text / foreground | frontend/src/pages/Landing.tsx:64 |
| `#8C9A8C` | 1 | border | frontend/src/components/interview/ProblemPanel.tsx:25 |
| `#8D4550` | 1 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#8FB8F2` | 2 | literal / token, text / foreground | frontend/src/components/effects/WaterWaves.tsx:11; frontend/src/index.css:87 |
| `#91A6C9` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:8 |
| `#91B8FF` | 1 | text / foreground | frontend/src/index.css:51 |
| `#92E7B6` | 1 | text / foreground | frontend/src/index.css:72 |
| `#9679241C` | 1 | shadow | frontend/src/pages/Landing.tsx:112 |
| `#96AAFF` | 1 | text / foreground | frontend/src/pages/RepoDebugging.tsx:19 |
| `#99667799` | 1 | text / foreground | frontend/src/pages/Landing.tsx:74 |
| `#99777766` | 1 | literal / token | frontend/src/pages/ProblemLibrary.tsx:105 |
| `#9A8960` | 1 | literal / token | frontend/src/lib/editorThemes.ts:65 |
| `#9ABEFF` | 4 | text / foreground | frontend/src/lib/editorThemes.ts:10; frontend/src/lib/editorThemes.ts:11; frontend/src/lib/editorThemes.ts:12; frontend/src/lib/editorThemes.ts:18 |
| `#9ABEFF22` | 1 | literal / token | frontend/src/lib/editorThemes.ts:30 |
| `#9B4D17` | 2 | text / foreground | frontend/src/lib/editorThemes.ts:47; frontend/src/lib/editorThemes.ts:48 |
| `#9B7920` | 1 | text / foreground | frontend/src/pages/InterviewSelection.tsx:108 |
| `#9B8CA9` | 1 | text / foreground | frontend/src/lib/feedback.ts:4 |
| `#9CB4FF` | 2 | text / foreground | frontend/src/index.css:69; frontend/src/index.css:71 |
| `#9FAEBD` | 1 | stroke | frontend/src/pages/Dashboard.tsx:214 |
| `#A3B2CC` | 1 | literal / token | frontend/src/pages/RepoDebugging.tsx:19 |
| `#A5DBD4` | 1 | literal / token | frontend/src/index.css:85 |
| `#A6B5FF` | 1 | background | frontend/src/components/dashboard/DashboardTour.tsx:97 |
| `#A72D39` | 3 | literal / token, text / foreground | frontend/src/index.css:83; frontend/src/pages/ProblemLibrary.tsx:28; frontend/src/pages/Recommended.tsx:15 |
| `#A9AFBF` | 1 | border | frontend/src/lib/theme.ts:5 |
| `#A9B8D0` | 1 | text / foreground | frontend/src/components/ui/ProblemLoading.tsx:14 |
| `#A9BCE0` | 3 | literal / token, text / foreground | frontend/src/components/interview/CodePanel.tsx:49; frontend/src/components/interview/InterviewPage.tsx:154 |
| `#A9BEFF` | 1 | background | frontend/src/pages/Landing.tsx:64 |
| `#AA5360` | 1 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#AAB7D0` | 1 | text / foreground | frontend/src/index.css:15 |
| `#ADBBC5` | 1 | literal / token | frontend/src/index.css:84 |
| `#AEB8D2` | 1 | text / foreground | frontend/src/lib/theme.ts:8 |
| `#AF4D25` | 1 | text / foreground | frontend/src/pages/Landing.tsx:74 |
| `#B43A48` | 1 | text / foreground | frontend/src/components/interview/ProblemPanel.tsx:25 |
| `#B6C7FF` | 1 | text / foreground | frontend/src/components/ui/ProblemLoading.tsx:17 |
| `#B8B9B5` | 1 | text / foreground | frontend/src/components/dashboard/InterviewCalendar.tsx:51 |
| `#B8C9E5` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:17 |
| `#B9BEC2` | 1 | background | frontend/src/pages/Landing.tsx:107 |
| `#B9C9FF` | 2 | border, text / foreground | frontend/src/pages/InterviewSelection.tsx:109; frontend/src/pages/SystemDesign.tsx:81 |
| `#B9D9AC` | 1 | text / foreground | frontend/src/lib/editorThemes.ts:13 |
| `#BDCCFF` | 1 | text / foreground | frontend/src/pages/ProblemLibrary.tsx:97 |
| `#BDD7FA` | 2 | literal / token, text / foreground | frontend/src/components/effects/WaterWaves.tsx:10; frontend/src/index.css:87 |
| `#BFDBFE` | 1 | literal / token | frontend/src/lib/editorThemes.ts:61 |
| `#BFDBFE66` | 1 | literal / token | frontend/src/lib/editorThemes.ts:63 |
| `#C0CEFF` | 2 | text / foreground | frontend/src/pages/Assessment.tsx:87 |
| `#C3CDE0` | 2 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/pages/RepoDebugging.tsx:19 |
| `#C4C9CC` | 2 | background | frontend/src/pages/Landing.tsx:107; frontend/src/pages/Landing.tsx:108 |
| `#C4CEFA` | 1 | background | frontend/src/components/dashboard/DashboardTour.tsx:97 |
| `#C5C8CE` | 15 | background, border, text / foreground | frontend/src/components/interview/InterviewModeGrid.tsx:4; frontend/src/components/interview/InterviewModeGrid.tsx:5; frontend/src/components/interview/InterviewModeGrid.tsx:6; frontend/src/components/interview/InterviewModeGrid.tsx:7 |
| `#C5DEF6` | 1 | text / foreground | frontend/src/pages/Landing.tsx:234 |
| `#C8D4EF` | 1 | text / foreground | frontend/src/index.css:67 |
| `#C99824` | 1 | text / foreground | frontend/src/pages/RepoDebugging.tsx:157 |
| `#CC3C09` | 3 | background, text / foreground | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#CDC9BF` | 1 | border | frontend/src/index.css:82 |
| `#CE5353` | 1 | background | frontend/src/pages/Landing.tsx:72 |
| `#D2DDFF` | 1 | text / foreground | frontend/src/pages/Landing.tsx:222 |
| `#D3A34F` | 1 | text / foreground | frontend/src/lib/feedback.ts:6 |
| `#D3DEFF` | 1 | text / foreground | frontend/src/index.css:70 |
| `#D5A8F4` | 1 | text / foreground | frontend/src/components/ui/ProblemLoading.tsx:17 |
| `#D6963B` | 1 | text / foreground | frontend/src/pages/RepoDebugging.tsx:166 |
| `#D9DCDE` | 1 | background | frontend/src/pages/Landing.tsx:102 |
| `#DBEAFE` | 1 | text / foreground | frontend/src/components/interview/VideoCallPanel.tsx:239 |
| `#DCE3F3` | 1 | text / foreground | frontend/src/pages/Landing.tsx:64 |
| `#DCE3FF` | 4 | text / foreground | frontend/src/components/interview/InterviewModeGrid.tsx:4; frontend/src/pages/Assessment.tsx:87; frontend/src/pages/Dashboard.tsx:25; frontend/src/pages/ProblemLibrary.tsx:97 |
| `#DCE7FF` | 1 | text / foreground | frontend/src/pages/Landing.tsx:211 |
| `#DD697C` | 3 | text / foreground | frontend/src/pages/RepoDebugging.tsx:166 |
| `#DE6675` | 1 | text / foreground | frontend/src/pages/Settings.tsx:76 |
| `#DEDBD2` | 1 | stroke | frontend/src/pages/Feedback.tsx:111 |
| `#DEDFDC` | 2 | border | frontend/src/pages/InterviewSelection.tsx:109; frontend/src/pages/InterviewSelection.tsx:110 |
| `#DEEEDF` | 1 | background | frontend/src/pages/Feedback.tsx:88 |
| `#DFE5FA` | 1 | border | frontend/src/pages/InterviewSelection.tsx:107 |
| `#DFE6FF` | 1 | background | frontend/src/pages/ProblemLibrary.tsx:112 |
| `#DFEAF5` | 2 | background | frontend/src/pages/Assessment.tsx:91; frontend/src/pages/Assessment.tsx:117 |
| `#DFEAF8` | 1 | literal / token | frontend/src/lib/editorThemes.ts:62 |
| `#E1F3E7` | 1 | background | frontend/src/components/interview/ProblemPanel.tsx:25 |
| `#E2493B` | 2 | background | frontend/src/components/interview/VideoCallPanel.tsx:277; frontend/src/components/interview/VideoCallPanel.tsx:296 |
| `#E2EBFA` | 2 | text / foreground | frontend/src/lib/editorThemes.ts:16; frontend/src/lib/editorThemes.ts:22 |
| `#E3EBFF` | 2 | background | frontend/src/pages/Landing.tsx:56; frontend/src/pages/Landing.tsx:70 |
| `#E3EEFF` | 2 | literal / token, text / foreground | frontend/src/components/effects/WaterWaves.tsx:9; frontend/src/index.css:87 |
| `#E3F0E6` | 3 | background, literal / token | frontend/src/index.css:83; frontend/src/pages/ProblemLibrary.tsx:26; frontend/src/pages/Recommended.tsx:15 |
| `#E4E2DB` | 8 | border | frontend/src/lib/theme.ts:5; frontend/src/pages/Assessment.tsx:92; frontend/src/pages/Dashboard.tsx:23; frontend/src/pages/InterviewReport.tsx:10 |
| `#E4E2DE` | 5 | border | frontend/src/pages/ProblemLibrary.tsx:101; frontend/src/pages/ProblemLibrary.tsx:103; frontend/src/pages/ProblemLibrary.tsx:105; frontend/src/pages/ProblemLibrary.tsx:107 |
| `#E5BA43` | 1 | background | frontend/src/components/interview/RepositoryExplorer.tsx:42 |
| `#E5DECB` | 1 | background | frontend/src/lib/editorThemes.ts:64 |
| `#E5E7EF` | 1 | background | frontend/src/components/dashboard/DashboardTour.tsx:97 |
| `#E7E5DF` | 1 | background | frontend/src/pages/ProblemLibrary.tsx:104 |
| `#E7E5E0` | 3 | border | frontend/src/pages/ProblemLibrary.tsx:109; frontend/src/pages/Recommended.tsx:64; frontend/src/pages/Recommended.tsx:66 |
| `#E7F0FC` | 6 | background, literal / token | frontend/src/components/dashboard/InterviewCalendar.tsx:28; frontend/src/components/dashboard/InterviewCalendar.tsx:34; frontend/src/components/dashboard/InterviewCalendar.tsx:39; frontend/src/components/dashboard/InterviewCalendar.tsx:51 |
| `#E8C842` | 1 | border | frontend/src/pages/Landing.tsx:70 |
| `#E8EFFF` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#E8EFFF40` | 1 | border | frontend/src/pages/Landing.tsx:209 |
| `#E8F1FB` | 1 | background | frontend/src/components/interview/VideoCallPanel.tsx:223 |
| `#E8F1FF` | 2 | literal / token | frontend/src/components/auth/AuthLayout.tsx:29; frontend/src/lib/theme.ts:6 |
| `#E9993E` | 1 | fill | frontend/src/pages/Landing.tsx:69 |
| `#E9EDFF` | 15 | background | frontend/src/components/dashboard/DashboardTour.tsx:101; frontend/src/components/interview/InterviewModeGrid.tsx:5; frontend/src/components/interview/InterviewModeGrid.tsx:6; frontend/src/lib/theme.ts:4 |
| `#EA4335` | 2 | fill | frontend/src/pages/Login.tsx:228; frontend/src/pages/Signup.tsx:300 |
| `#EAD4AD` | 2 | border | frontend/src/pages/InterviewSelection.tsx:111; frontend/src/pages/ProblemLibrary.tsx:100 |
| `#EDF1FB` | 3 | literal / token, text / foreground | frontend/src/index.css:13; frontend/src/index.css:14; frontend/src/pages/RepoDebugging.tsx:19 |
| `#EDF1FF` | 1 | text / foreground | frontend/src/components/auth/AuthLayout.tsx:22 |
| `#EDF3F7` | 1 | literal / token | frontend/src/index.css:84 |
| `#EE5B4D` | 2 | background | frontend/src/components/interview/VideoCallPanel.tsx:277; frontend/src/components/interview/VideoCallPanel.tsx:296 |
| `#EEE7FF` | 1 | background | frontend/src/pages/ProblemLibrary.tsx:23 |
| `#EEE8DA` | 1 | literal / token | frontend/src/index.css:81 |
| `#EEECE5` | 1 | background | frontend/src/lib/theme.ts:4 |
| `#F0CF76` | 3 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/index.css:73 |
| `#F0F3FF` | 1 | background | frontend/src/pages/InterviewSelection.tsx:107 |
| `#F2C078` | 1 | literal / token | frontend/src/index.css:85 |
| `#F2E5C4` | 1 | literal / token | frontend/src/index.css:79 |
| `#F3A7CC` | 1 | literal / token | frontend/src/index.css:85 |
| `#F3D365` | 1 | text / foreground | frontend/src/pages/Landing.tsx:64 |
| `#F3E9C9` | 1 | literal / token | frontend/src/components/interview/sandbox-skin.css:14 |
| `#F4CF37` | 2 | background | frontend/src/pages/Dashboard.tsx:26; frontend/src/pages/Landing.tsx:193 |
| `#F4F7FC` | 3 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/components/ui/ProblemLoading.tsx:4; frontend/src/pages/RepoDebugging.tsx:19 |
| `#F5CB68` | 1 | background | frontend/src/index.css:78 |
| `#F5DFBB` | 1 | background | frontend/src/pages/Feedback.tsx:88 |
| `#F5F0E3` | 1 | background | frontend/src/pages/SystemDesign.tsx:46 |
| `#F6E9BF` | 1 | literal / token | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#F6EFD9` | 2 | background | frontend/index.html:2; frontend/index.html:12 |
| `#FAC52E` | 10 | background, border, literal / token, text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/components/interview/TopBar.tsx:54; frontend/src/components/interview/VideoCallPanel.tsx:194; frontend/src/components/interview/VideoCallPanel.tsx:232 |
| `#FAC52E22` | 1 | background | frontend/src/lib/editorThemes.ts:33 |
| `#FAC52E33` | 1 | background | frontend/src/lib/editorThemes.ts:66 |
| `#FBBC05` | 2 | fill | frontend/src/pages/Login.tsx:223; frontend/src/pages/Signup.tsx:295 |
| `#FBE9EB` | 3 | background, literal / token | frontend/src/index.css:83; frontend/src/pages/ProblemLibrary.tsx:28; frontend/src/pages/Recommended.tsx:15 |
| `#FBF4DF` | 12 | background, literal / token, text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/components/interview/sandbox-skin.css:7; frontend/src/components/interview/sandbox-skin.css:13; frontend/src/index.css:77 |
| `#FF8796` | 1 | background | frontend/src/components/interview/InterviewPage.tsx:154 |
| `#FF8C91` | 1 | background | frontend/src/components/ui/ProblemLoading.tsx:16 |
| `#FFA2AC` | 4 | text / foreground | frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/index.css:74 |
| `#FFCF8A` | 2 | text / foreground | frontend/src/lib/editorThemes.ts:14; frontend/src/lib/editorThemes.ts:15 |
| `#FFD75D` | 1 | background | frontend/src/components/interview/VideoCallPanel.tsx:232 |
| `#FFDF4F` | 25 | background, literal / token, stroke, text / foreground | frontend/src/components/auth/AuthLayout.tsx:21; frontend/src/components/dashboard/DashboardTour.tsx:70; frontend/src/components/dashboard/DashboardTour.tsx:86; frontend/src/components/interview/InterviewModeGrid.tsx:7 |
| `#FFDF4F66` | 1 | shadow | frontend/src/components/ui/ProblemLoading.tsx:9 |
| `#FFE6E8` | 1 | background | frontend/src/components/interview/ProblemPanel.tsx:25 |
| `#FFE879` | 1 | background | frontend/src/pages/ProblemLibrary.tsx:14 |
| `#FFF0A3` | 1 | background | frontend/src/pages/Dashboard.tsx:156 |
| `#FFF0AE` | 1 | background | frontend/src/pages/Landing.tsx:220 |
| `#FFF0BF` | 1 | background | frontend/src/components/interview/ProblemPanel.tsx:25 |
| `#FFF0D7` | 2 | background | frontend/src/pages/InterviewSelection.tsx:111; frontend/src/pages/ProblemLibrary.tsx:100 |
| `#FFF1CB` | 4 | background, literal / token | frontend/src/index.css:83; frontend/src/pages/ProblemLibrary.tsx:27; frontend/src/pages/Recommended.tsx:15; frontend/src/pages/SystemDesign.tsx:52 |
| `#FFF3BA` | 2 | background | frontend/src/pages/InterviewSelection.tsx:108; frontend/src/pages/ProblemLibrary.tsx:22 |
| `#FFFCF4` | 2 | background, text / foreground | frontend/src/lib/editorThemes.ts:54; frontend/src/pages/RepoDebugging.tsx:19 |
| `#FFFDF7` | 6 | background, literal / token, text / foreground | frontend/src/components/interview/sandbox-skin.css:8; frontend/src/components/interview/sandbox-skin.css:16; frontend/src/components/interview/sandbox-skin.css:18; frontend/src/components/interview/sandbox-skin.css:21 |
| `#FFFDF8` | 51 | background, fill, literal / token, ring, text / foreground | frontend/src/components/dashboard/DashboardTour.tsx:73; frontend/src/components/dashboard/InterviewCalendar.tsx:25; frontend/src/components/dashboard/InterviewCalendar.tsx:51; frontend/src/components/effects/PageClouds.tsx:3 |
| `#FFFFFF` | 22 | background, literal / token, shadow, text / foreground | frontend/src/components/interview/CodePanel.tsx:53; frontend/src/components/interview/CodePanel.tsx:56; frontend/src/components/interview/InterviewPage.tsx:154; frontend/src/components/interview/sandbox-skin.css:35 |
| `#FFFFFF12` | 1 | shadow | frontend/src/pages/Landing.tsx:209 |
| `#FFFFFF15` | 1 | background | frontend/src/pages/Assessment.tsx:87 |
| `#FFFFFF25` | 1 | border | frontend/src/pages/Assessment.tsx:87 |
| `#FFFFFF26` | 1 | border | frontend/src/pages/Landing.tsx:234 |
| `#fff` | 65 | background, outline, text | frontend/src/components/auth/AssessmentGate.tsx:23; frontend/src/components/auth/AuthLayout.tsx:20; frontend/src/components/auth/AuthLayout.tsx:21; frontend/src/components/dashboard/DashboardTour.tsx:85 |
| `color-mix(in oklab, #000 10%, transparent)` | 1 | border | frontend/src/pages/Settings.tsx:82 |
| `color-mix(in oklab, #0A1120 65%, transparent)` | 1 | background | frontend/src/pages/RepoDebugging.tsx:173 |
| `color-mix(in oklab, #101A35 65%, transparent)` | 1 | background | frontend/src/pages/Settings.tsx:95 |
| `color-mix(in oklab, #182137 10%, transparent)` | 3 | background, border | frontend/src/pages/Assessment.tsx:16; frontend/src/pages/Assessment.tsx:94; frontend/src/pages/Feedback.tsx:80 |
| `color-mix(in oklab, #182137 15%, transparent)` | 17 | border | frontend/src/pages/Feedback.tsx:67; frontend/src/pages/Feedback.tsx:68; frontend/src/pages/Feedback.tsx:73; frontend/src/pages/Landing.tsx:50 |
| `color-mix(in oklab, #182137 20%, transparent)` | 6 | border | frontend/src/pages/Assessment.tsx:106; frontend/src/pages/Assessment.tsx:107; frontend/src/pages/Assessment.tsx:125; frontend/src/pages/Landing.tsx:49 |
| `color-mix(in oklab, #182137 25%, transparent)` | 2 | border | frontend/src/pages/Dashboard.tsx:174; frontend/src/pages/Dashboard.tsx:175 |
| `color-mix(in oklab, #182137 30%, transparent)` | 1 | background | frontend/src/pages/Settings.tsx:82 |
| `color-mix(in oklab, #182137 35%, transparent)` | 1 | text | frontend/src/pages/Assessment.tsx:91 |
| `color-mix(in oklab, #182137 40%, transparent)` | 1 | text | frontend/src/pages/Assessment.tsx:91 |
| `color-mix(in oklab, #182137 5%, transparent)` | 1 | border | frontend/src/pages/Feedback.tsx:10 |
| `color-mix(in oklab, #182137 60%, transparent)` | 1 | text | frontend/src/pages/Assessment.tsx:95 |
| `color-mix(in oklab, #182137 8%, transparent)` | 1 | border | frontend/src/pages/Feedback.tsx:81 |
| `color-mix(in oklab, #3054ED 10%, transparent)` | 5 | background | frontend/src/pages/RepoDebugging.tsx:157; frontend/src/pages/RepoDebugging.tsx:161; frontend/src/components/interview/RepositoryExplorer.tsx:39; frontend/src/components/interview/RepositoryExplorer.tsx:40 |
| `color-mix(in oklab, #3054ED 15%, transparent)` | 1 | background | frontend/src/components/interview/RepositoryExplorer.tsx:40 |
| `color-mix(in oklab, #3054ED 30%, transparent)` | 1 | border | frontend/src/pages/RepoDebugging.tsx:166 |
| `color-mix(in oklab, #3054ED 40%, transparent)` | 1 | border | frontend/src/pages/Assessment.tsx:16 |
| `color-mix(in oklab, #3054ED 75%, transparent)` | 1 | border | frontend/src/pages/Assessment.tsx:15 |
| `color-mix(in oklab, #4566ED 10%, transparent)` | 1 | background | frontend/src/pages/Settings.tsx:80 |
| `color-mix(in oklab, #4566ED 20%, transparent)` | 7 | border, ring | frontend/src/pages/Landing.tsx:56; frontend/src/pages/Login.tsx:124; frontend/src/pages/Login.tsx:153; frontend/src/pages/Signup.tsx:154 |
| `color-mix(in oklab, #4B505C 25%, transparent)` | 2 | border | frontend/src/pages/Login.tsx:88; frontend/src/pages/Signup.tsx:115 |
| `color-mix(in oklab, #4B505C 30%, transparent)` | 8 | border | frontend/src/pages/Login.tsx:124; frontend/src/pages/Login.tsx:153; frontend/src/pages/Login.tsx:182; frontend/src/pages/Signup.tsx:154 |
| `color-mix(in oklab, #8195C9 20%, transparent)` | 1 | border | frontend/src/components/ui/ProblemLoading.tsx:15 |
| `color-mix(in oklab, #8195ED 60%, transparent)` | 1 | border | frontend/src/pages/Settings.tsx:80 |
| `color-mix(in oklab, #DFEAF5 70%, transparent)` | 2 | background | frontend/src/pages/Assessment.tsx:91; frontend/src/pages/Assessment.tsx:117 |
| `color-mix(in oklab, #E9EDFF 90%, transparent)` | 1 | background | frontend/src/pages/Dashboard.tsx:163 |
| `color-mix(in oklab, #fff 10%, transparent)` | 1 | background | frontend/src/components/dashboard/DashboardTour.tsx:88 |
| `color-mix(in oklab, #fff 15%, transparent)` | 3 | background | frontend/src/components/interview/InterviewModeGrid.tsx:4; frontend/src/pages/Dashboard.tsx:174; frontend/src/pages/Dashboard.tsx:175 |
| `color-mix(in oklab, #fff 20%, transparent)` | 2 | background | frontend/src/components/dashboard/DashboardTour.tsx:88; frontend/src/pages/Settings.tsx:82 |
| `color-mix(in oklab, #fff 30%, transparent)` | 2 | background | frontend/src/pages/Dashboard.tsx:174; frontend/src/pages/Dashboard.tsx:175 |
| `color-mix(in oklab, #fff 35%, transparent)` | 1 | border | frontend/src/components/auth/AuthLayout.tsx:20 |
| `color-mix(in oklab, #fff 38%, transparent)` | 6 | background, border | frontend/src/pages/Dashboard.tsx:30; frontend/src/pages/Dashboard.tsx:33 |
| `color-mix(in oklab, #fff 40%, transparent)` | 1 | background | frontend/src/pages/Settings.tsx:82 |
| `color-mix(in oklab, #fff 45%, transparent)` | 2 | border | frontend/src/pages/Dashboard.tsx:32 |
| `color-mix(in oklab, #fff 50%, transparent)` | 1 | background | frontend/src/pages/Settings.tsx:82 |
| `color-mix(in oklab, #fff 55%, transparent)` | 1 | background | frontend/src/components/auth/ProfileGate.tsx:69 |
| `color-mix(in oklab, #fff 70%, transparent)` | 1 | border | frontend/src/components/dashboard/DashboardTour.tsx:73 |
| `color-mix(in oklab, #fff 75%, transparent)` | 2 | background, text | frontend/src/components/dashboard/DashboardTour.tsx:87; frontend/src/pages/Assessment.tsx:16 |
| `color-mix(in oklab, #fff 80%, transparent)` | 1 | background | frontend/src/components/dashboard/InterviewCalendar.tsx:52 |
| `color-mix(in oklab, #fff 90%, transparent)` | 2 | border, text | frontend/src/components/auth/ProfileGate.tsx:69; frontend/src/components/interview/VideoCallPanel.tsx:236 |
| `color-mix(in oklab, oklch(87.2% 0.01 258.338) 30%, transparent)` | 1 | background | frontend/src/components/interview/VideoCallPanel.tsx:227 |
| `oklch(43.9% 0 none)` | 1 | text | frontend/src/pages/Signup.tsx:221 |
| `oklch(50.5% 0.213 27.518)` | 2 | text | frontend/src/pages/Assessment.tsx:109; frontend/src/pages/Recommended.tsx:65 |
| `oklch(57.7% 0.245 27.325)` | 2 | text | frontend/src/pages/Login.tsx:101; frontend/src/pages/Signup.tsx:128 |
| `oklch(63.7% 0.237 25.331)` | 3 | text | frontend/src/components/interview/TestResultPanel.tsx:82; frontend/src/components/interview/TestResultPanel.tsx:85; frontend/src/components/interview/TestResultPanel.tsx:93 |
| `oklch(69.6% 0.17 162.48)` | 3 | text | frontend/src/components/interview/ProblemPanel.tsx:26; frontend/src/components/interview/TestResultPanel.tsx:85; frontend/src/components/interview/TestResultPanel.tsx:93 |
| `oklch(70.8% 0 none)` | 2 | text | frontend/src/pages/Login.tsx:170; frontend/src/pages/Signup.tsx:243 |
| `oklch(92.2% 0 none)` | 4 | background | frontend/src/pages/Login.tsx:168; frontend/src/pages/Login.tsx:174; frontend/src/pages/Signup.tsx:241; frontend/src/pages/Signup.tsx:247 |
| `oklch(97.1% 0.013 17.38)` | 4 | background | frontend/src/pages/Assessment.tsx:109; frontend/src/pages/Login.tsx:101; frontend/src/pages/Recommended.tsx:65; frontend/src/pages/Signup.tsx:128 |
| `transparent` | 4 | background | frontend/src/components/interview/problem-description.css:38; frontend/src/components/interview/sandbox-skin.css:38; frontend/src/components/ui/Sidebar.tsx:35; frontend/src/index.css:60 |

## Other source declarations

These CSS files are not imported from the current main.tsx/App import graph: frontend/src/styles/tokens.css, styles/ui.css, styles/pages.css, components/interview/interview.css. They may document earlier variants. The all-source CSV labels these entries so they are not mistaken for current overrides.

Source reference: frontend/src/index.css, frontend/src/lib/theme.ts, frontend/index.html, frontend/src/pages/Landing.tsx, frontend/src/components/interview/sandbox-skin.css, frontend/src/lib/editorThemes.ts.
