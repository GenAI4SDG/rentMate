# RentMate — what to settle first

**What we're building:** a web app that helps non-local students in Hong Kong find a verified flat and a compatible flatmate without paying an agent HK$5,000.

**The team:** four of us, all new to React and Supabase.
**The clock:** submission ~18 October. We stop building 14 October.

Everything else is already written down. This page is only the things that are still open.

---

## 1. Decisions — four people need to agree

### Sitting 1 — before anyone writes code

| # | Decision | Why it's urgent |
|---|---|---|
| **D1** | **Where does our data live, and who may touch it?** My proposal: the database holds only three things — who is verified, quiz answers, and the roommate matches. The listing search, the AI listing audit, chat and the settling-in plan store nothing and read nothing. If we agree this, one person owns the database and three people can build without waiting for them. | If we leave this open, everyone waits on the one person setting up the database |
| **D2** | **Who owns which files?** The rule "one person per file" is already agreed. What's open is the split. Two options: one person owns all of `src/` and the other owns only the database side, **or** each person owns whole features and works in their own folders. My proposal: the second, because it lets both coders start today. | Two AI tools editing one file silently overwrite each other |
| **D3** | **Which AI model do we pay for, and what is the hard spending cap?** Nobody experiments until this number exists. | Every AI feature is blocked until this is set |

### Sitting 2 — before the first Friday demo

| # | Decision | Why it matters |
|---|---|---|
| **D4** | **Do we commit what we have?** Eight files are changed and uncommitted. Mine: commit now, because a broken laptop currently costs us a week. | We have no working demo tagged yet |
| **D5** | **Which laptop do we demo on?** Mine: one machine, named today, used for every rehearsal. | A demo that only works on one machine is a demo we can't hand to a presenter |
| **D6** | **Who presents on the day, and who records the backup video?** Mine: separate people. The video is insurance, not a formality. | The demo is live. A dead laptop with no video scores zero |
| **D7** | **Do we want maps and transport data in the app?** It would strengthen the district information. It is not required, and it costs time to arrange. | Nice-to-have, but decide rather than drift |

### Sitting 3 — whenever the organisers reply

| # | Decision | Why it waits |
|---|---|---|
| **D8** | **How do we structure the pitch deck and the interim report?** | The organisers haven't sent the requirements. The underlying work isn't blocked — only the packaging is |

---

## 2. Tasks — already assigned, nothing to decide

Listed so nobody asks "what am I doing". Do them in any order.

| Person | Task |
|---|---|
| P1 — platform | The project's TypeScript settings are wrong for a web app and currently produce errors. Fixing this unblocks P2 |
| P1 — platform | Create the one file that defines our data shapes, so everyone codes against the same definitions |
| P1 — platform | Set up the database and invite the other three |
| P2 — frontend | Install the routing and styling libraries |
| P3 — data & AI | Write the sample data — 10 fake student profiles and 8 fake flats. Everyone building matching or listings needs these to test against |
| P3 — data & AI | Assemble the Hong Kong reference material the AI answers from — rent data, tenancy rules, contract terms, district facts. The organisers gave us nothing, so this is on us |
| P4 — product & ethics | Run the user interviews, and own the pitch narrative and demo script |

> **D3 is the one decision nobody owns yet.** Whoever ends up holding the AI budget should be the one who picks the provider. Decide that first, or the AI work stalls.

### Evidence to lead with

| Finding | Figure | Note |
|---|---|---|
| Want verified profiles | **73%** (30 of 41) | Our #1 of 12 features |
| Rate trust verification important | **68%**, and only **2 of 41** said it didn't matter | The strongest single number we have |
| Privacy is the top complaint about shared living | **17 of 41** | Ahead of finding a roommate (12) and rent (11) |

**Two caveats you must say out loud when citing these:**
- **51% of the people we surveyed already live in a dormitory.** So most of the pain they describe is *imagined*, not lived.
- **41 people, one survey, self-selected.** It's a signal, not proof.

### Where to read more

| Question | File |
|---|---|
| What are we actually building, feature by feature? | `docs/pitch-and-data-pack.md` |
| What do I build, in which files? | `docs/build-plans.md` |
| Why are we doing this at all? The full case | `TEAM-BRIEF.md` |

---

## 3. One thing to know before you touch the code

The project's TypeScript configuration was set up for a **Node** program, but this is a **web app**. That mismatch caused a file to sit empty and produced import errors that looked like typos.

It's fixed. But if TypeScript ever complains about file extensions in imports, the fix is the **configuration**, not the import line. And never re-add the `declaration` settings — they conflict with how we build.
