# The Mom Test Simulator PRD

## Problem Statement

Founders need to get better at customer discovery interviews, but it is hard to practice the skill safely and repeatedly. Real customer conversations are scarce, socially awkward, and costly to waste. Generic chat practice does not train the founder to handle politeness, vague praise, hypotheticals, bad-fit respondents, buyer/user mismatches, or the temptation to pitch.

The Learner needs a voice-first simulator that feels like a real customer interview, lets them make mistakes without live coaching, and then gives a concrete Session Report that helps them improve their Interview Behavior over time.

## Solution

Build a single-player, voice-first practice platform for customer discovery interviews. A Learner presses Start Practice and immediately enters a spoken Session with one generated Customer Persona. The Session includes realistic Conversational Friction, possible Traps, hidden Customer Fit, and truthful Concrete History when the Learner asks strong questions.

The product does not ask for the Learner's startup idea in v1. Instead, the Learner may optionally maintain multiple Ideal Customer Profiles in Profile Settings and choose one Active Ideal Customer Profile. If none is active, Sessions use the Broad Practice Pool. Each Session is evaluated silently through Hidden Evaluation, ends through user quit, Natural Conclusion, Credit Exhaustion, Voice Failure, or the 60-minute cap, and routes directly to Report Generating State and then a Session Report.

The Session Report is the coaching surface. It includes outcome, missed signals, bad questions, strong questions, Trap Results, skill movement, next practice focus, and Expandable Evidence from the Session Transcript. Progression grows from both Session Report quality and enough completed-session evidence. Achievement Nodes reward skill milestones. Global Ranking remains in Insufficient Data State until there is enough credible evidence, then shows percentile bands rather than exact leaderboard positions.

## User Stories

1. As a visitor, I want to understand that the product helps me sharpen my skill to talk to customers, so that I know why it matters before signing up.
2. As a visitor, I want to see messaging that frames the product as Mom Test-style practice without implying official affiliation, so that I understand the product honestly.
3. As a visitor, I want to sign up or log in from the Landing Page, so that I can start practicing.
4. As a Learner, I want to land on the Practice Dashboard after signing in, so that I can start practice without lesson-style onboarding.
5. As a Learner, I want a prominent Start Practice action, so that I can begin a Session quickly.
6. As a Learner, I want the Practice Dashboard to show my Progression, so that I can see whether my customer interview skill is improving.
7. As a Learner, I want the Practice Dashboard to show Global Ranking only when credible, so that I am not misled by fake percentile data.
8. As a Learner, I want an Insufficient Data State before ranking is credible, so that I know more evidence is needed.
9. As a Learner, I want recent Session Reports on the Practice Dashboard, so that I can revisit feedback.
10. As a Learner, I do not want the Practice Dashboard to show lessons, tasks, modules, calendars, or checklists, so that the product stays focused on practice.
11. As a Learner, I want to create an Ideal Customer Profile in Profile Settings, so that generated Customer Personas can fit the customers I want to practice interviewing.
12. As a Learner, I want to create multiple Ideal Customer Profiles, so that I can practice against different customer categories.
13. As a Learner, I want to select one Active Ideal Customer Profile, so that future Sessions use the right customer context.
14. As a Learner, I want to edit or switch my Active Ideal Customer Profile anytime, so that future Sessions reflect my current practice focus.
15. As a Learner, I want past reports to remain tied to the profile context used at the time, so that old reports stay understandable.
16. As a Learner without an Active Ideal Customer Profile, I want the simulator to use a Broad Practice Pool, so that I can still practice with realistic customer contexts.
17. As a Learner, I want Start Practice to immediately begin a Session, so that there is no pre-session configuration friction.
18. As a Learner, I want the Session to begin with a short Opening Context, so that I can start naturally without seeing a full persona dossier.
19. As a Learner, I want the Session to be a Voice Conversation, so that practice feels closer to a real customer interview.
20. As a Learner, I want the Customer Persona to include Conversational Friction, so that I practice handling hesitation, vague answers, rambling, mild discomfort, interruption, and questions back.
21. As a Learner, I want the Customer Persona to be coherent enough to interview, so that the Session remains fair and evaluable.
22. As a Learner, I want the persona to give unreliable social signals when I ask weak questions, so that I experience the cost of bad discovery behavior.
23. As a Learner, I want the persona to answer Concrete History truthfully when I ask strong questions, so that good interview behavior is rewarded with useful truth.
24. As a Learner, I want some Customer Personas to be strong-fit, weak-fit, bad-fit, buyer/user mismatches, or influencers, so that I learn to identify Customer Fit rather than chase validation.
25. As a Learner, I want the simulator to avoid maliciously inventing false Concrete History, so that the practice remains fair.
26. As a Learner, I want the Session to include possible Traps without revealing them, so that the conversation feels natural.
27. As a Learner, I do not want live coaching during the Session, so that I stay inside the interview flow.
28. As a Learner, I want Hidden Evaluation to happen silently, so that my feedback comes after the Session rather than interrupting it.
29. As a Learner, I want the Session Timer and end control visible during the Session, so that I know how long I have been practicing and can quit.
30. As a Learner, I do not want score, Progression, Global Ranking, Trap count, or evaluative hints visible during the Session, so that I focus on the customer.
31. As a Learner, I want to quit whenever I get frustrated or feel done, so that I remain in control.
32. As a Learner, I want the simulator to reach a Natural Conclusion when enough practice material has been exercised, so that Sessions do not stretch robotically to 60 minutes.
33. As a Learner, I want no Session to exceed 60 minutes, so that practice has a clear maximum.
34. As a Learner, I want the first Free Trial Session to last up to 15 minutes, so that I can experience the value before paying.
35. As a Learner, I want the Free Trial Session to generate a real Session Report, so that I understand the product's feedback loop.
36. As a Learner, I want the Free Trial Session to unlock the first Achievement Node, so that it kickstarts my Progression path.
37. As a Learner, I do not want the Free Trial Session alone to unlock Global Ranking, so that ranking stays credible.
38. As a Learner, I want paid Sessions to use Credits, so that I can pay based on usage.
39. As a Learner, I want Credits estimated before Start Practice, so that I understand the potential cost.
40. As a Learner, I want paid Sessions charged by actual duration, so that short Sessions do not feel unfair.
41. As a Learner, I want credit usage rounded into simple time blocks, so that the pricing model is understandable.
42. As a Learner, I want Subscription Credits to cover a limited number of monthly interviews, so that I have predictable recurring practice capacity.
43. As a Learner, I want to buy more usage beyond Subscription Credits, so that I can keep practicing when I need more Sessions.
44. As a Learner, I want Credit Exhaustion to end a Session gracefully, so that I am not cut off mid-sentence.
45. As a Learner, I do not want purchase modals inside the Voice Conversation, so that monetization does not break the interview illusion.
46. As a Learner, I want Voice Failure to pause, resume if possible, or end gracefully, so that technical failures do not corrupt the experience.
47. As a Learner, I want unused Credits from failed voice time refunded or not charged, so that billing feels fair.
48. As a Learner, I want a partial Session Report after Voice Failure only when there is enough evidence, so that feedback is not fabricated.
49. As a Learner, I do not want a text fallback during a Session, so that the product remains voice-first.
50. As a Learner, I want to see Report Generating State immediately after a Session ends, so that I know the report is being produced.
51. As a Learner, I want to land directly on the Session Report after generation, so that the feedback payoff is immediate.
52. As a Learner, I want the Session Report to summarize the outcome, so that I know what useful truth I did or did not extract.
53. As a Learner, I want the Session Report to identify Missed Signals, so that I see where I failed to follow up.
54. As a Learner, I want the Session Report to identify Bad Questions, so that I understand when I asked hypotheticals, pitched, led the persona, or chased compliments.
55. As a Learner, I want the Session Report to identify Strong Questions, so that I know what worked.
56. As a Learner, I want the Session Report to include Trap Results, so that I can see which Traps I fell for, avoided, or partially handled.
57. As a Learner, I want the Session Report to include skill movement, so that I see how the Session affected Progression.
58. As a Learner, I want the Session Report to include one next practice focus, so that I know what to work on next.
59. As a Learner, I want the Session Report to show the Active Ideal Customer Profile or Broad Practice Pool used, so that report context is clear.
60. As a Learner, I want the Session Report to show a light persona label, so that I remember who I interviewed.
61. As a Learner, I do not want the Session Report to expose the full hidden backstory by default, so that the hidden practice mechanic stays intact.
62. As a Learner, I want Expandable Evidence from the Session Transcript inside report comments, so that I can inspect evidence without deep transcript navigation.
63. As a Learner, I want the Session Transcript available after the Session, so that I can review the conversation when needed.
64. As a Learner, I want the Session Report to be the primary feedback surface, so that I am not buried in raw transcript.
65. As a Learner, I want reports and transcripts private by default, so that I can practice and fail safely.
66. As a Learner, I want to delete reports and account data, so that I control my practice history.
67. As a Learner, I do not want raw Audio Recording stored by default, so that privacy risk is lower.
68. As a Learner, I want durable records to include transcript, evaluation artifacts, Generated Session Case, and report data, so that reports can be reviewed and audited.
69. As a Learner, I want no exact Session retry, so that I improve skill rather than memorize a case.
70. As a Learner, I want Practice Again from the same Ideal Customer Profile to create a different Customer Persona, so that repeated practice remains fresh.
71. As a Learner, I want Progression to depend on both report quality and enough session evidence, so that neither raw volume nor one lucky strong Session overstates my skill.
72. As a Learner, I want Achievement Nodes along the Progression path, so that improvement feels visible and game-like.
73. As a Learner, I want Achievement Nodes to reward skill milestones, so that I feel I am becoming better at customer interviews.
74. As a Learner, I want volume rewarded only when paired with quality, so that shallow usage does not dominate Progression.
75. As a Learner, I want Global Ranking shown as percentile bands when credible, so that I can understand relative skill without leaderboard addiction.
76. As a Learner, I do not want exact public ranks, so that the product stays focused on skill improvement.
77. As the product operator, I want Generated Session Cases preserved internally, so that reports can be audited for fairness and quality.
78. As the product operator, I want the Hidden Test Plan preserved internally, so that Trap Results and Session Reports can be explained after the fact.
79. As the product operator, I want no startup idea input in v1, so that the product trains discovery skill rather than pitch validation.
80. As the product operator, I want the Working Product Name to remain "The Mom Test Simulator" for now while avoiding official affiliation claims, so that branding can move forward without over-deciding legal concerns.

## Implementation Decisions

- Build v1 as a single-player product for one Learner. Do not introduce teams, coaches, organization accounts, shared report review, or social features.
- Keep the public Landing Page separate from the authenticated practice loop. Landing Page copy uses the Working Product Name for now but must not imply official Mom Test affiliation.
- After sign up or log in, route directly to the Practice Dashboard. Do not add lesson-style onboarding inside the authenticated app.
- The Practice Dashboard centers Start Practice, Progression, Global Ranking or Insufficient Data State, and recent Session Reports. It does not show next practice focus in v1.
- Profile Settings manages multiple Ideal Customer Profiles and one Active Ideal Customer Profile. It does not behave like a per-session setup screen.
- The simulator never asks for startup idea input in v1.
- A Persona Generation module should generate one Customer Persona per Session from either the Active Ideal Customer Profile or the Broad Practice Pool.
- Persona generation should include Customer Fit diversity: strong-fit, weak-fit, bad-fit, buyer/user mismatch, and influencer cases.
- A Generated Session Case should preserve the generated persona, hidden backstory, Customer Fit, Hidden Test Plan, Traps, transcript, evaluation, and report internally.
- A Generated Session Case is not exposed as a full user-facing dossier and cannot be retried exactly.
- A Session Orchestrator module should own the Session lifecycle: Start Practice, Opening Context, Voice Conversation, user quit, Natural Conclusion, Credit Exhaustion, Voice Failure, 60-minute cap, Report Generating State, and Session Report routing.
- A Voice Runtime boundary should isolate live voice transport, transcription, persona speech, interruption behavior, and failure handling. Gemini Live API is a possible runtime, but the runtime choice is not finalized in this PRD.
- The Voice Conversation is the only v1 practice interface. Do not implement text chat fallback during a Session.
- The Session UI shows Session Timer and end control only. It hides score, Progression, Global Ranking, Trap count, and evaluative hints.
- Conversational Friction is part of the persona behavior: hesitation, rambling, vague answers, mild discomfort, interruption, and questions back, while staying coherent enough to evaluate.
- Persona truthfulness must distinguish unreliable social signals from truthful Concrete History. The persona may be polite, vague, flattering, or speculative, but should not maliciously invent false Concrete History.
- Hidden Test Plan is never revealed before or during a Session. It can be revealed through the Session Report after the Session.
- Hidden Evaluation assesses Interview Behavior silently during the Session. It evaluates question quality and basic conversational conduct, not accent, charisma, vocal polish, or sounding confident.
- Report Builder should produce a Session Report after every completed Session and after failed Sessions only when enough evidence exists.
- Session Report sections are outcome, missed signals, bad questions, strong questions, Trap Results, skill movement, next practice focus, ICP/source context, light persona label, and Expandable Evidence.
- Session Transcript supports post-session evidence. V1 uses Expandable Evidence snippets inside report comments rather than deep transcript links.
- Reports and transcripts are private by default. V1 does not support public report links, social feeds, coach sharing, or shared report review.
- Raw Audio Recording is not stored by default. Durable records are Session Transcript, evaluation artifacts, Generated Session Case, and Session Report.
- A Credits module should support one Free Trial Session capped at 15 minutes, paid Sessions after trial, Subscription Credits, and usage-based top-ups.
- Paid Sessions estimate Credits before Start Practice and charge based on actual duration, rounded into simple time blocks.
- Credit Exhaustion steers the Session toward graceful ending and report generation. Do not show purchase modals inside the Voice Conversation.
- Voice Failure pauses the Session, resumes if possible, or ends gracefully. Unused failed voice time is refunded or not charged.
- A Progression module should combine completed-session volume and Session Report quality. A single strong Session must not produce elite Progression.
- Progression is visualized as a straight path with Achievement Nodes. The Free Trial Session unlocks the first Achievement Node.
- Achievement Nodes should reward skill milestones first, with volume rewarded only when paired with quality.
- Global Ranking derives from Progression but remains in Insufficient Data State until enough user and population evidence exists. When unlocked, it uses percentile bands rather than exact rank.
- Data deletion must allow a Learner to delete reports and account data.

## Testing Decisions

- Tests should verify external product behavior and domain rules, not prompt internals or private implementation details.
- Persona Generation tests should verify that multiple Customer Personas can be generated from one Active Ideal Customer Profile, that no active ICP uses the Broad Practice Pool, and that Customer Fit diversity is represented.
- Session Orchestrator tests should verify lifecycle paths: Start Practice, user quit, Natural Conclusion, 60-minute cap, Credit Exhaustion, Voice Failure, and routing to Report Generating State and Session Report.
- Voice Runtime boundary tests should use fakes to simulate speech input, persona output, transcript events, interruption, latency, and failure without requiring real live voice calls.
- Hidden Evaluation tests should verify Mom Test behaviors: avoiding pitching, asking about Concrete History, following up on vague answers, resisting compliments, identifying bad-fit personas, and uncovering existing workarounds or decision process.
- Report Builder tests should verify all required Session Report sections, Trap Results after the Session, ICP/source context, light persona label, and Expandable Evidence.
- Transcript/evidence tests should verify that report comments can expand evidence snippets without requiring deep transcript links in v1.
- Credits tests should verify free trial cap, duration-based charging, simple time-block rounding, Subscription Credits, top-up usage, graceful Credit Exhaustion, and fair handling after Voice Failure.
- Progression tests should verify that both quality and evidence volume are required, that one strong Session cannot unlock elite Progression, and that the Free Trial Session contributes lightly.
- Achievement Node tests should verify that nodes reward skill milestones and that the first node unlocks after the Free Trial Session.
- Global Ranking tests should verify Insufficient Data State before enough evidence and percentile bands after credible evidence, with no exact leaderboard ranks.
- Privacy tests should verify reports and transcripts are private by default, raw Audio Recording is not stored by default, and deletion removes reports and account data according to the product's data lifecycle.
- UI behavior tests should verify the Practice Dashboard avoids course/task/checklist surfaces, the Session UI hides evaluative signals, and post-session navigation opens the report directly after report generation.
- Monetization flow tests should verify there is no in-session purchase modal during a Voice Conversation.
- Regression tests should include generated report examples that demonstrate high-quality outcomes where the Learner discovers a persona is not a real customer.
- Because there is no existing codebase yet, there is no prior local test pattern to follow. The first implementation should establish test boundaries around the deep modules above before building broad UI coverage.

## Out of Scope

- Teams, coaches, organization accounts, shared report review, or classroom workflows.
- Public report links, social feeds, or any sharing feature.
- Text chat Sessions or text fallback during a Voice Conversation.
- Raw Audio Recording as a default stored artifact.
- Exact Session retry.
- Startup idea input, hidden idea context, pitch setup, or idea validation forms.
- Lesson-style onboarding, courses, tasks, modules, checklists, calendars, or productivity workflows.
- Dashboard next practice focus in v1.
- Past-weakness personalization of future Sessions in v1.
- Revealing the Hidden Test Plan before or during a Session.
- Showing full generated persona backstory to the Learner by default.
- Exact leaderboard ranks.
- Accent, charisma, vocal polish, or confidence scoring.
- Deep transcript links in v1.
- A whole artificial society, audience panel, or multi-person simulation.
- Final voice runtime commitment. Gemini Live API is a candidate, not a locked architecture decision in this PRD.

## Further Notes

- Proposed hero/title direction from the founder: "Sharpen your skill to talk to your customers."
- Additional founder-provided copy directions: "Get better at customer interview" and "In the era of agents taking away grunt work, founders' skill to understand users matters more than ever."
- Supporting landing-page copy is intentionally unresolved beyond the founder-provided directions.
- The Working Product Name remains "The Mom Test Simulator" for now. The product must avoid implying official affiliation with The Mom Test.
- The product should feel like a game-like practice loop: press Start Practice, do a voice Session, receive a report, see Progression and Achievement Nodes, then practice again.
- Issue tracker publication is not completed from this workspace because the project is not a git repository and no issue tracker or triage label vocabulary is configured yet.
