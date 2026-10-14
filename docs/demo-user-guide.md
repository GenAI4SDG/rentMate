# RentMate — Demo user guide

**Audience:** teammates, judges, anyone running the hackathon demo  
**Time:** ~5 minutes to set up · ~3 minutes to walk through the product

---

## What you are demoing

**RentMate** helps Hong Kong students find **compatible roommates** and explore **affordable flats**, supporting **SDG 11** (sustainable cities and communities).

| Part                               | Folder           | What it shows                                  |
| ---------------------------------- | ---------------- | ---------------------------------------------- |
| **Interactive UI (main demo)**     | `Figma/`         | Full flow with sample data — no login required |
| **App shell (future integration)** | repo root `src/` | Placeholder until the Figma UI is merged       |
| **Backend (optional)**             | `backend/`       | Supabase tables, auth, storage (cloud project) |

For most hackathon presentations, run **`Figma/`** only. Mention Supabase if you pushed migrations and want to show the dashboard.

---

## Before the demo (once per machine)

### 1. Install Node.js

Install **Node.js 20+** from [nodejs.org](https://nodejs.org/) if you do not have it.

Check:

```bash
node -v
npm -v
```

### 2. Run the demo app

```bash
cd Figma
npm install
npm run dev
```

Open the URL in the browser (usually **<http://localhost:5173>**).

### 3. Optional — Supabase backend

Only if you want to show a real database (not required for the UI demo):

```bash
cd backend
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Use **Project Settings → API** in the Supabase dashboard for URL and keys. Put secrets in a local `.env` file (never commit it).

You do **not** need Docker if you use **cloud** Supabase and `db push`.

---

## Demo script (3 minutes)

1. **Landing** — “Meet your kind of people.” Explain SDG 11 and student housing in HK.
2. **Start matching** → enter a university-style email, e.g. `student@cuhk.edu.hk` → continue.
3. **Quiz** — answer all 7 questions → **See my matches**.
4. **Matches** — open a profile → **Connect & start chatting**.
5. **Messages** — send a short message.
6. **Find a flat** — search a district, pick a listing, open **3D tour** (optional wow moment).

**Say clearly:** “Profiles and listings in this build are **sample data** for the hackathon; Supabase in `backend/` is ready for real auth and listings next.”

---

## Troubleshooting

| Problem                       | Fix                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `command not found: npm`      | Install Node.js                                                                       |
| `command not found: vite`     | Run `npm install` inside `Figma/`                                                     |
| Blank page                    | Check terminal for errors; try another browser                                        |
| `supabase db push` fails      | Read the error; fix migration order; ask a teammate                                   |
| Red squiggles on `.sql` files | Disable **SQL Server (mssql)** extension for this workspace; files are **PostgreSQL** |

---

## Share with teammates

```bash
git pull origin main
cd Figma && npm install && npm run dev
```

Repo: `https://github.com/GenAI4SDG/rentMate`

Do **not** commit `.env` or API keys. Use `backend/.env.example` as a template only.

---

## More documentation

| Document                                  | Purpose                            |
| ----------------------------------------- | ---------------------------------- |
| [README.md](../README.md)                 | Project overview and team workflow |
| [PRD.md](../PRD.md)                       | Product scope                      |
| [TEAM-BRIEF.md](../TEAM-BRIEF.md)         | Roles and dates                    |
| [backend/README.md](../backend/README.md) | Supabase technical setup           |
