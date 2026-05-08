# Mom Test Simulator

A practice environment for entrepreneurs to improve customer discovery interview skill through uninterrupted simulated conversations and post-session feedback.

## Language

**Session**:
A complete spoken practice interview case with a virtual persona, customer context, hidden truth, conversational turns, and a final report.
_Avoid_: Scenario, case

**Trap**:
A conversational moment that may lure the user into weak discovery behavior, such as pitching, accepting compliments, asking hypotheticals, or failing to dig into concrete past behavior.
_Avoid_: Googly, trick

**Customer Persona**:
The simulated interview counterpart representing a plausible real customer with context, constraints, past behavior, and social incentives.
_Avoid_: AI character, bot

**Ideal Customer Profile**:
One of the user's optional account-level descriptions of the kind of customers they want to practice interviewing.
_Avoid_: Audience, segment, society

**Active Ideal Customer Profile**:
The selected Ideal Customer Profile currently used to shape future generated Customer Personas.
_Avoid_: Session setup choice, one-off persona source

**Auto-Generated Persona**:
A Customer Persona created by the simulator either randomly or within the user's Ideal Customer Profile.
_Avoid_: Artificial society, panel

**Broad Practice Pool**:
The default set of realistic customer contexts used when the Learner has no Active Ideal Customer Profile.
_Avoid_: Arbitrary random people, joke persona

**Profile Settings**:
The account-level area where a user may create, edit, and select Ideal Customer Profiles.
_Avoid_: Session setup, pre-session form

**Progression**:
The user's accumulated customer interview skill level inferred from both Session Report quality and enough completed-session evidence.
_Avoid_: Manual difficulty setting, course level

**Achievement Node**:
A milestone on the Progression path unlocked by meaningful practice accomplishments.
_Avoid_: Badge spam, lesson completion

**Global Ranking**:
The user's percentile position relative to other users' measured customer interview skill.
_Avoid_: Leaderboard score, vanity rank

**Insufficient Data State**:
The Global Ranking state shown when there is not enough user or population evidence to produce a credible percentile.
_Avoid_: Placeholder rank, fake percentile

**Start Practice**:
The action that immediately begins a new Session without a pre-session configuration screen.
_Avoid_: Configure session, create scenario

**Practice Dashboard**:
The main out-of-session surface for starting practice, seeing skill progress, ranking state, and recent reports.
_Avoid_: Course page, productivity dashboard, lesson plan

**Learner**:
The individual user practicing customer interview skill.
_Avoid_: Team, coach, organization

**Landing Page**:
The public marketing page that explains the product and sends users to sign up or log in.
_Avoid_: Onboarding, lesson intro

**Working Product Name**:
The current product name, "The Mom Test Simulator," used while brand concerns remain unresolved.
_Avoid_: Official Mom Test product, licensed product

**Free Trial Session**:
The user's first no-cost Session, capped at 15 minutes.
_Avoid_: Demo, sample chat

**Credits**:
The usage currency spent to start paid Sessions after the Free Trial Session.
_Avoid_: Tokens, minutes

**Subscription Credits**:
Monthly included Credits from a small subscription plan.
_Avoid_: Unlimited plan, course membership

**Credit Exhaustion**:
The state where a user's available Credits are no longer enough to continue a paid Session.
_Avoid_: Hard cutoff, mid-call paywall

**Voice Failure**:
A technical failure in voice input, voice output, or transcription during a Session.
_Avoid_: Text fallback, silent degradation

**Audio Recording**:
Stored raw audio from a Voice Conversation.
_Avoid_: Required session artifact, default recording

**Opening Context**:
The brief natural introduction shown at the start of a Session, without revealing a full persona dossier.
_Avoid_: Persona dossier, customer brief

**Natural Conclusion**:
The simulator-led ending of a Session when the conversation has sufficiently exercised the planned practice material before the 60-minute cap.
_Avoid_: Completed all traps, quiz finished

**Hidden Evaluation**:
The simulator's internal assessment of the user's interview behavior after a Session ends.
_Avoid_: Real-time coaching, live hints

**Hidden Test Plan**:
The unrevealed set of skills, traps, and persona dynamics the simulator may evaluate in a Session.
_Avoid_: Pre-session objectives, visible challenge list

**Generated Session Case**:
The preserved internal record of the generated Customer Persona, hidden backstory, Customer Fit, Hidden Test Plan, Traps, transcript, evaluation, and report.
_Avoid_: User-facing dossier, exact retry seed

**Session Report**:
The post-session feedback that summarizes what happened, where the user failed, and what to reflect on.
_Avoid_: Live feedback, transcript notes

**Report Generating State**:
The short post-session waiting state while the Session Report is produced.
_Avoid_: Dashboard redirect, blank loading

**Trap Result**:
The post-session assessment of whether the user fell for, avoided, or partially handled a Trap.
_Avoid_: Live trap status, trap counter

**Session Transcript**:
The transcribed conversation record available after a Session for reviewing evidence behind the Session Report.
_Avoid_: Main report, live notes

**Expandable Evidence**:
Transcript excerpts that can be expanded from Session Report comments.
_Avoid_: Deep links, transcript navigation

**Voice Conversation**:
The live spoken interaction between the user and the Customer Persona during a Session.
_Avoid_: Text chat, written interview

**Conversational Friction**:
Natural voice behavior such as hesitation, rambling, vague answers, mild discomfort, interruption, and questions back to the user.
_Avoid_: Chaos, perfect turn-taking

**Interview Behavior**:
The user's question quality and basic conversational conduct during a Voice Conversation.
_Avoid_: Vocal polish, charisma score

**Concrete History**:
Specific past behavior, paid attempts, recent events, constraints, and decisions from the Customer Persona's backstory.
_Avoid_: Opinion, future intent

**Learning Signal**:
Useful truth the user extracts about customer behavior, pain, workarounds, willingness to pay, decision process, or non-customer fit.
_Avoid_: Validation, yes, interest

**Customer Fit**:
The hidden degree to which a Customer Persona plausibly belongs to the Ideal Customer Profile and has a problem worth discovering.
_Avoid_: Qualified lead, prospect score

**Session Timer**:
The visible elapsed-time indicator shown during a Session.
_Avoid_: Progress bar, trap counter

## Relationships

- V1 includes **Landing Page**, authentication, **Practice Dashboard**, **Profile Settings**, **Start Practice**, **Voice Conversation**, **Report Generating State**, **Session Report**, credit gating, **Progression**, **Achievement Nodes**, and **Insufficient Data State**
- V1 excludes teams, coaches, exact retry, text chat mode, default **Audio Recording**, dashboard next focus, past-weakness personalization, public report sharing, and lesson-style onboarding
- A **Session** contains zero or more **Traps**
- A **Trap** appears inside the conversation flow and is evaluated after the **Session**, not explained during it
- A **Session** has exactly one **Customer Persona**
- A **Session** is a **Voice Conversation**, not a text chat
- A **Voice Conversation** includes **Conversational Friction** while remaining coherent enough to evaluate
- **Hidden Evaluation** assesses **Interview Behavior**, including question quality and basic conversational conduct
- In v1, **Hidden Evaluation** does not score accent, vocal polish, charisma, or sounding confident
- **Profile Settings** may contain multiple **Ideal Customer Profiles**
- At most one **Ideal Customer Profile** is the **Active Ideal Customer Profile**
- One **Ideal Customer Profile** can produce many different **Customer Personas**
- A **Session** selects one generated **Customer Persona**, either randomly or shaped by the user's **Active Ideal Customer Profile**
- Without an **Active Ideal Customer Profile**, **Customer Personas** come from the **Broad Practice Pool**
- Editing or switching the **Active Ideal Customer Profile** affects future **Sessions**, not past **Generated Session Cases** or reports
- The simulator does not receive startup idea input in v1
- A **Session** may end before 60 minutes, but never exceeds 60 minutes
- V1 is single-player: one **Learner** owns their **Progression**, **Global Ranking**, reports, Credits, and optional **Ideal Customer Profile**
- V1 does not support teams, coaches, organization accounts, or shared report review
- **Session Reports** and **Session Transcripts** are private to the **Learner** by default
- V1 does not support public report links, social feeds, or report sharing
- A **Learner** can delete reports and account data
- V1 does not store **Audio Recording** by default
- **Session Transcripts**, evaluation artifacts, and reports are the default post-session records
- **Start Practice** immediately begins a **Session** with no pre-session configuration screen
- The **Practice Dashboard** centers **Start Practice**, **Progression**, **Global Ranking** or **Insufficient Data State**, and recent **Session Reports**
- The **Practice Dashboard** should not center tasks, modules, lessons, checklists, or calendars
- In v1, the **Practice Dashboard** should not show next practice focus; the **Session Report** owns that feedback
- The **Landing Page** is outside the authenticated practice loop and routes users to sign up or log in
- The **Working Product Name** can remain "The Mom Test Simulator" for now
- The product should not imply it is an official Mom Test product
- Landing-page supporting copy is not resolved yet
- After sign up or log in, the user reaches the **Practice Dashboard** without a lesson-style onboarding step
- A user may define an **Ideal Customer Profile** from **Profile Settings**
- The first Session is a **Free Trial Session** capped at 15 minutes
- After the **Free Trial Session**, Sessions require **Credits**
- **Subscription Credits** cover a limited number of monthly interviews, and users may buy more usage beyond that
- Paid Sessions estimate **Credits** before **Start Practice** and charge based on actual Session duration
- Credit usage may be rounded into simple time blocks rather than charged as a flat cost per **Session**
- **Credit Exhaustion** should steer a paid **Session** toward a graceful ending and **Session Report**
- A **Voice Conversation** should not show an in-session purchase modal or hard cutoff mid-sentence
- **Voice Failure** should pause, resume if possible, or end gracefully without switching to text chat
- Unused **Credits** from failed voice time should be refunded or not charged
- A partial **Session Report** should only be generated after **Voice Failure** when there is enough evidence
- A **Session** begins with **Opening Context**, not a detailed **Customer Persona** dossier
- A **Session** can end by user quit, **Natural Conclusion**, or the 60-minute cap
- A **Natural Conclusion** does not reveal how many **Traps** were planned or encountered
- The **Hidden Test Plan** is not revealed before or during a **Session**
- The **Session Report** may reveal what the **Hidden Test Plan** evaluated after the **Session**
- A **Generated Session Case** is preserved internally for audit and report quality
- A **Generated Session Case** is not exposed to the user as a full hidden backstory by default
- **Hidden Evaluation** runs after a **Session** ends using the **Session Transcript**, without interrupting the conversation
- **Hidden Evaluation** uses both the **Session Transcript** and internal **Generated Session Case** context (including hidden mechanics) to produce evaluation artifacts
- A **Session Report** is generated after a **Session** ends
- After a **Session** ends, the user sees the **Report Generating State** and then the **Session Report** directly
- Coaching appears in the **Session Report**, not during the **Session**
- A **Session Report** includes outcome, missed signals, bad questions, strong questions, **Trap Results**, skill movement, and next practice focus
- **Trap Results** are revealed only after the **Session** ends
- A **Session Report** shows the **Active Ideal Customer Profile** or **Broad Practice Pool** used, plus a light persona label
- A **Session Report** does not expose the full hidden backstory by default
- A **Session Transcript** is available after the **Session**, but the **Session Report** is the primary feedback surface
- In v1, a **Session Report** may show **Expandable Evidence** from the **Session Transcript** instead of transcript links
- A **Session** cannot be retried exactly
- Practicing again from the same **Ideal Customer Profile** creates a new **Session** with a different **Customer Persona**
- A **Customer Persona** may give unreliable social signals but should answer truthfully when asked about **Concrete History**
- A **Customer Persona** should not maliciously invent false **Concrete History**
- A successful **Session** produces **Learning Signal**, not agreement or praise
- Discovering that a **Customer Persona** is not a real customer can be a high-quality **Learning Signal**
- Sessions should include diverse **Customer Fit**, including strong-fit, weak-fit, bad-fit, buyer/user mismatch, and influencer personas
- During a **Session**, the user may see a **Session Timer** and end control
- During a **Session**, the user should not see score, **Progression**, **Global Ranking**, **Trap** count, or evaluative hints
- **Progression** increases through a mix of completed-session volume and **Session Report** quality
- A single high-quality **Session** should not automatically produce elite **Progression**
- **Progression** is visualized as a path with **Achievement Nodes**, not only a plain bar
- **Achievement Nodes** should primarily reward skill milestones, with volume rewarded only when paired with quality
- Completing the **Free Trial Session** unlocks the first **Achievement Node** and contributes lightly to **Progression**
- **Global Ranking** is derived from **Progression**, not chosen by the user
- The **Free Trial Session** alone should not unlock **Global Ranking**
- **Global Ranking** should show an **Insufficient Data State** until there is enough evidence
- **Global Ranking** should use percentile bands, not exact leaderboard positions
- In v1, past report weaknesses do not shape future **Sessions**

## Example dialogue

> **Dev:** "Should every persona response be a Trap?"
> **Domain expert:** "No — a **Session** should feel like one natural interview. A **Trap** is only a possible test inside that conversation."
> **Dev:** "What is the v1 product loop?"
> **Domain expert:** "Landing, auth, practice dashboard, optional ICP settings, voice practice, report, credits, progression, and ranking placeholder. Leave collaboration, lessons, text fallback, exact retry, and personalization out."
> **Dev:** "Are we simulating a whole market?"
> **Domain expert:** "No — the product may create an **Auto-Generated Persona**, but the user practices one interview with one **Customer Persona** at a time."
> **Dev:** "Should the user enter the idea they are testing?"
> **Domain expert:** "No — **Profile Settings** may contain **Ideal Customer Profiles**, but the simulator does not ask for a pitch."
> **Dev:** "Could we keep the idea hidden from the persona but visible to the evaluator?"
> **Domain expert:** "No — v1 should not collect startup idea input at all."
> **Dev:** "Does the user pick beginner, standard, or brutal?"
> **Domain expert:** "No — **Progression** starts at beginner and the simulator increases difficulty as the user improves."
> **Dev:** "What happens when the user presses start?"
> **Domain expert:** "**Start Practice** immediately begins the **Session**. The user may see a short **Opening Context**, but not a setup screen or persona dossier."
> **Dev:** "Is the home screen a course?"
> **Domain expert:** "No — it is a **Practice Dashboard** centered on starting another practice loop and reviewing progress."
> **Dev:** "Can coaches or teams review reports in v1?"
> **Domain expert:** "No — v1 is for one **Learner** improving their own interview skill."
> **Dev:** "Can users share reports publicly?"
> **Domain expert:** "No — **Session Reports** and **Session Transcripts** are private to the **Learner** in v1."
> **Dev:** "Do we store the actual call audio?"
> **Domain expert:** "No — v1 does not store **Audio Recording** by default; the durable artifacts are transcript, evaluation, and report data."
> **Dev:** "Should the dashboard show next practice focus?"
> **Domain expert:** "No for v1 — the **Session Report** owns next practice focus to keep the **Practice Dashboard** simple."
> **Dev:** "Does the authenticated app repeat the landing-page promise?"
> **Domain expert:** "No — the **Landing Page** handles marketing. After sign up or log in, the user goes to the **Practice Dashboard**."
> **Dev:** "Is this an official Mom Test product?"
> **Domain expert:** "No — the **Working Product Name** can remain for now, but the product should not imply official affiliation."
> **Dev:** "How does the user try the product?"
> **Domain expert:** "The first **Free Trial Session** is capped at 15 minutes. After that, Sessions use **Credits**."
> **Dev:** "Does every paid **Session** cost the same?"
> **Domain expert:** "No — paid Sessions estimate **Credits** up front and charge based on actual duration."
> **Dev:** "What happens if credits run out during a call?"
> **Domain expert:** "**Credit Exhaustion** should lead to a graceful ending, not a hard mid-conversation paywall."
> **Dev:** "Should voice failure fall back to text chat?"
> **Domain expert:** "No — **Voice Failure** should pause, resume if possible, or end gracefully with fair credit handling."
> **Dev:** "Does every **Session** run for the full hour?"
> **Domain expert:** "No — 60 minutes is only the cap. The simulator can reach a **Natural Conclusion** earlier if the conversation has done enough work."
> **Dev:** "Should the simulator correct the user when they ask a bad question?"
> **Domain expert:** "No — **Hidden Evaluation** tracks it silently. The **Session Report** gives feedback after the conversation ends."
> **Dev:** "Where should the user go after ending a **Session**?"
> **Domain expert:** "Show the **Report Generating State**, then open the **Session Report** directly."
> **Dev:** "Should the user know what skill the next **Session** is testing?"
> **Domain expert:** "No — the **Hidden Test Plan** stays hidden until the **Session Report**."
> **Dev:** "Should we preserve what the simulator generated?"
> **Domain expert:** "Yes — keep the **Generated Session Case** internally for audit and report quality, but do not expose the full hidden backstory by default."
> **Dev:** "Can the persona lie?"
> **Domain expert:** "The persona can be polite, vague, or speculative, but should answer truthfully when asked for **Concrete History**."
> **Dev:** "Is it a failed **Session** if the user finds out the persona is not a customer?"
> **Domain expert:** "No — that can be excellent **Learning Signal** if the user discovered it through good questions."
> **Dev:** "Should every generated persona secretly be a good customer?"
> **Domain expert:** "No — **Customer Fit** should vary so users practice identifying strong-fit and bad-fit people."
> **Dev:** "Should the user see progress or score while interviewing?"
> **Domain expert:** "No — only a **Session Timer** and end control. Evaluative feedback waits until the **Session Report**."
> **Dev:** "Can one excellent **Session** make the user top 1%?"
> **Domain expert:** "No — **Progression** needs both quality and enough evidence across completed **Sessions**."
> **Dev:** "Does the free trial count?"
> **Domain expert:** "Yes — the **Free Trial Session** generates a real **Session Report** and unlocks the first **Achievement Node**, but does not unlock **Global Ranking** by itself."
> **Dev:** "Should achievements reward streaks and raw usage?"
> **Domain expert:** "No — **Achievement Nodes** should mainly reward better interview skill, not shallow activity."
> **Dev:** "What should ranking show before it is credible?"
> **Domain expert:** "Use an **Insufficient Data State**, then show percentile bands when there is enough evidence."
> **Dev:** "Can we show which traps happened?"
> **Domain expert:** "Yes, but only as **Trap Results** inside the **Session Report**, not during the interview."
> **Dev:** "Should old reports show what ICP/persona they used?"
> **Domain expert:** "Yes — show the **Active Ideal Customer Profile** or **Broad Practice Pool** and a light persona label, not the hidden backstory."
> **Dev:** "Should we show the transcript?"
> **Domain expert:** "Yes, but the **Session Report** comes first and uses simple **Expandable Evidence** instead of deep transcript links in v1."
> **Dev:** "Can the user retry the exact same **Session**?"
> **Domain expert:** "No — they can practice again from the same **Ideal Customer Profile**, but the next **Session** should use a different **Customer Persona**."
> **Dev:** "Can users change ICPs?"
> **Domain expert:** "Yes — they can create multiple **Ideal Customer Profiles** and choose an **Active Ideal Customer Profile** for future **Sessions**."
> **Dev:** "What happens with no active ICP?"
> **Domain expert:** "The simulator uses the **Broad Practice Pool**, not arbitrary random people."
> **Dev:** "Is v1 text-based?"
> **Domain expert:** "No — the **Session** is a **Voice Conversation**. Text artifacts exist after the conversation for reporting and evidence."
> **Dev:** "Should the persona always answer cleanly?"
> **Domain expert:** "No — **Conversational Friction** is part of the practice, as long as the interview stays coherent."
> **Dev:** "Are we only grading question wording?"
> **Domain expert:** "No — **Interview Behavior** includes question quality and basic conversational conduct, but not vocal polish."

## Flagged ambiguities

- "scenario" was used to mean the full interview case; resolved: use **Session** for the full case.
- "v1 scope" was clarified: keep the core voice practice/report/progression loop and exclude adjacent collaboration, course, sharing, personalization, and fallback surfaces.
- "googly" was used to mean a possible test inside the conversation; resolved: use **Trap**.
- "auto" was compared to artificial society products; resolved: use **Auto-Generated Persona** for a simple generated counterpart, not a simulated audience.
- "what the user brings into a Session" was too broad; resolved: the user may provide an **Ideal Customer Profile** in **Profile Settings**, not during each **Session**.
- "hidden idea context" was considered; resolved: v1 has no startup idea input, hidden or otherwise.
- "persona source" sounded like a pre-session form; resolved: **Customer Personas** are generated per **Session**, while the optional **Ideal Customer Profile** lives in **Profile Settings**.
- "ICP" was clarified: users may manage multiple **Ideal Customer Profiles** and select one **Active Ideal Customer Profile**.
- "random personas" was clarified: no active ICP uses a **Broad Practice Pool** of realistic discovery contexts.
- "difficulty" sounded user-selected; resolved: difficulty adapts from **Progression** and **Global Ranking**.
- "main screen" was clarified: use a **Practice Dashboard**, not a course or productivity surface.
- "user" was clarified: v1 serves an individual **Learner**, not teams, coaches, or organizations.
- "report privacy" was clarified: **Session Reports** and **Session Transcripts** are private by default with no sharing in v1.
- "voice storage" was clarified: no **Audio Recording** by default in v1.
- "next practice focus" was clarified: keep it in the **Session Report**, not the v1 **Practice Dashboard**.
- "onboarding" was clarified: use a public **Landing Page** before auth, not a lesson-style onboarding step after auth.
- "product name" was clarified: keep **Working Product Name** for now while avoiding official Mom Test affiliation claims.
- "landing copy" remains unresolved beyond the user's provided hero/tagline ideas.
- "monetization" was clarified: users get one **Free Trial Session**, then pay with **Credits** through subscription and usage-based purchase.
- "credit cost" was clarified: paid Sessions are duration-based, not flat-priced.
- "running out of credits" was clarified: use graceful **Credit Exhaustion**, not abrupt interruption.
- "voice fallback" was clarified: **Voice Failure** should not switch the **Session** to text chat.
- "previous weaknesses" was considered as an input to future session generation; resolved: keep this out of v1.
- "60 minutes" was treated as a fixed duration; resolved: it is a maximum cap, not a target length.
- "what the next Session tests" was clarified: the **Hidden Test Plan** is not shown before or during the **Session**.
- "session auditability" was clarified: preserve the **Generated Session Case** internally without making it user-facing by default.
- "feedback" was ambiguous between live coaching and after-action review; resolved: feedback belongs in the **Session Report** after the **Session**.
- "post-session navigation" was clarified: route to **Report Generating State** and then the **Session Report**, not back to the dashboard first.
- "bad data" was clarified: weak questions produce unreliable social signals, but strong questions can uncover truthful **Concrete History**.
- "success" was clarified: success means extracting **Learning Signal**, not getting compliments or agreement.
- "diverse personas" was clarified: diversity includes variation in **Customer Fit**, not just demographics or job titles.
- "in-session visibility" was clarified: the **Session Timer** may be visible, but evaluative progress stays outside the **Session**.
- "Progression" was clarified: it depends on report quality and evidence volume, not either one alone.
- "progress bar" was clarified: **Progression** should include **Achievement Nodes** along a straight path, with the **Free Trial Session** as the first milestone.
- "achievements" were clarified: **Achievement Nodes** are skill-first, not badge spam for raw usage.
- "Global Ranking" was clarified: it is confidence-gated and banded, not a precise leaderboard.
- "Session Report" was clarified: it should be tied to concrete conversation moments and include **Trap Results**.
- "report context" was clarified: show ICP/source and light persona label without exposing the hidden backstory.
- "transcript" was clarified: the **Session Transcript** is supporting evidence, not the primary feedback surface; v1 uses **Expandable Evidence**, not deep links.
- "retry" was clarified: exact **Session** retry is not allowed because it trains memorization.
- "conversation" was clarified: v1 is voice-first, not text-based.
- "realistic voice behavior" was clarified: use **Conversational Friction** without making the **Session** chaotic.
- "evaluation scope" was clarified: evaluate **Interview Behavior**, not accent, charisma, or vocal polish.
