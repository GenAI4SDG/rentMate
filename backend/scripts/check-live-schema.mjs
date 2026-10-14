#!/usr/bin/env node
/**
 * check-live-schema.mjs — does the live Supabase project match the repo?
 * ===========================================================================
 * WHY THIS EXISTS
 *
 * On 2026-10-14 the app was finally pointed at the real project
 * (`ghvonvhpcmozpsfzuexo`) and *still* refused to persist. The cause was not the
 * client: the live database carries an older, auth-based schema, and every
 * `create table if not exists` in our migrations is a **silent no-op** against a
 * table of the same name that already exists with a different shape.
 *
 * That failure mode is invisible from the app — the table exists, the client
 * connects, and only the writes fail, one missing column at a time. This script
 * makes it visible in one command.
 *
 * WHAT IT DOES
 *
 * Reads the URL + anon key the same way the app does (Figma/.env.local), then
 * asks PostgREST for each table/column the app actually writes to. A `select`
 * that comes back 200 means the column exists; 400 means it does not; 404
 * PGRST205 means the table does not.
 *
 * It is READ-ONLY. It writes nothing, creates nothing, and needs no service key.
 *
 * USAGE
 *   node backend/scripts/check-live-schema.mjs
 *   node backend/scripts/check-live-schema.mjs --url <url> --key <key>
 *
 * Exit code 0 = every check passed. 1 = drift found (prints exactly what).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");

/* ------------------------------------------------------------------ config */

function fromEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    const out = {};
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return out;
  } catch {
    return {};
  }
}

function argOf(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const appEnv = fromEnvFile(resolve(REPO, "Figma", ".env.local"));
const url = argOf("--url") ?? process.env.VITE_SUPABASE_URL ?? appEnv.VITE_SUPABASE_URL;
const key = argOf("--key") ?? process.env.VITE_SUPABASE_ANON_KEY ?? appEnv.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "No Supabase URL/key found.\n" +
      "  Looked in Figma/.env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n" +
      "  With both blank the app runs in local mode on purpose — nothing to check.",
  );
  process.exit(0);
}

/* -------------------------------------------------------------------- spec */

/**
 * Every table + column the app writes to, and the file that writes it, so a
 * failure points straight at the code that will break.
 */
const EXPECTED = [
  {
    table: "roommate_profiles",
    key: "email",
    columns: [
      "email", "display_name", "institution", "about_me", "looking_for",
      "gender_identity", "mbti_type", "belief_system", "campus_district",
      "target_areas", "interests", "budget_min", "budget_max",
      "study_year", "major", "created_at", "updated_at",
    ],
    usedBy: "Figma/src/lib/api.ts saveProfile()",
  },
  {
    table: "messages",
    key: null,
    columns: ["id", "conversation_id", "sender_email", "body", "created_at"],
    usedBy: "Figma/src/lib/api.ts sendMessage()",
  },
  {
    table: "reports",
    key: null,
    columns: ["id", "reporter_email", "reported_email", "conversation_id", "reason", "created_at"],
    usedBy: "Figma/src/lib/api.ts reportMessage()",
  },
  {
    table: "blocks",
    key: null,
    columns: ["id", "blocker_email", "blocked_email", "created_at"],
    usedBy: "Figma/src/lib/api.ts blockUser()",
  },
  {
    table: "demo_listings",
    key: null,
    columns: [
      "id", "title", "district", "monthly_rent", "bedrooms", "bathrooms",
      "area_sqft", "near_mtr", "rating", "image_key", "map_x", "map_y", "tips",
    ],
    usedBy: "Figma/src/lib/homesApi.ts loadListingPool()",
  },
  {
    table: "saved_listings",
    key: null,
    columns: ["email", "listing_id", "note", "status"],
    usedBy: "Figma/src/lib/homesApi.ts (shortlist + booking status)",
  },
  {
    table: "conversation_listings",
    key: null,
    columns: ["conversation_id", "listing_id", "added_by_email"],
    usedBy: "Figma/src/lib/homesApi.ts (send listing to chat)",
  },
  {
    table: "viewings",
    key: null,
    columns: ["id", "conversation_id", "listing_id", "match_email", "other_email", "when_text", "confirmed"],
    usedBy: "Figma/src/lib/homesApi.ts (book a viewing)",
  },
];

/* ------------------------------------------------------------------- probe */

async function probe(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

console.log(`\n${C.bold("RentMate — live schema check")}`);
console.log(C.dim(`  project: ${url}`));
console.log(C.dim(`  mode:    read-only, anon key\n`));

let missingTables = 0;
let missingColumns = 0;

for (const spec of EXPECTED) {
  const table = await probe(`${spec.table}?select=*&limit=1`);

  if (table.status === 404 || table.body.includes("PGRST205")) {
    console.log(`${C.red("MISSING TABLE")}  ${C.bold(spec.table)}`);
    console.log(C.dim(`               needed by ${spec.usedBy}`));
    missingTables++;
    continue;
  }

  if (table.status !== 200) {
    console.log(`${C.red("UNREADABLE")}     ${C.bold(spec.table)}  (HTTP ${table.status})`);
    console.log(C.dim(`               ${table.body.slice(0, 160)}`));
    missingTables++;
    continue;
  }

  // Table exists — now check each column the app writes.
  const bad = [];
  for (const col of spec.columns) {
    const r = await probe(`${spec.table}?select=${col}&limit=1`);
    if (r.status !== 200) bad.push(col);
  }

  if (bad.length === 0) {
    console.log(`${C.green("OK")}             ${C.bold(spec.table)}  ${C.dim(`${spec.columns.length} cols`)}`);
  } else {
    console.log(`${C.red("DRIFT")}          ${C.bold(spec.table)}  ${C.dim(`missing ${bad.length}/${spec.columns.length}`)}`);
    console.log(`               missing: ${C.red(bad.join(", "))}`);
    console.log(C.dim(`               needed by ${spec.usedBy}`));
    if (spec.key && bad.includes(spec.key)) {
      console.log(
        C.red(`               ⚠ the account key "${spec.key}" is missing — this is an`),
      );
      console.log(
        C.red("                 older table of the same name; `create table if not"),
      );
      console.log(C.red("                 exists` no-op'd. Reset or drop-and-recreate."));
    }
    missingColumns += bad.length;
  }
}

/* ------------------------------------------------------------------ verdict */

console.log("");
if (missingTables === 0 && missingColumns === 0) {
  console.log(C.green("ALL CHECKS PASSED — the live project matches the repo."));
  console.log(C.dim("  The app will persist to Postgres; the account menu shows 'Saved to your account'.\n"));
  process.exit(0);
}

console.log(C.red("DRIFT FOUND — the app is running in local mode until this is fixed."));
if (missingTables) console.log(`  ${missingTables} table(s) missing or unreadable`);
if (missingColumns) console.log(`  ${missingColumns} column(s) missing`);
console.log(
  C.dim(
    "\n  Fix: see the 'EXISTING project' section of backend/supabase/SETUP.md.\n" +
      "  Re-running the migrations is NOT enough — `create table if not exists`\n" +
      "  silently skips a table that already exists with a different shape.\n",
  ),
);
process.exit(1);
