// University-email eligibility — CP.validate_institution_email.v1.
//
// ELIGIBILITY IS NOT VERIFICATION. A matching domain proves the address *looks*
// like a university address; it does not prove the mailbox exists or belongs to
// the student. Real confirmation is Supabase Auth's job (see lib/api.ts).
//
// The list below is the team's own published table (12 institutions, 41 email
// domains, English + Chinese names). Match is EXACT / dot-boundary only — never a
// substring test — so `cuhk.edu.hk.evil.com` and `notcuhk.edu.hk` both fail.

export type Institution = {
  name: string;
  nameZh: string;
  domains: string[];
  /**
   * The district the student's campus anchors the commute to. Multi-campus
   * institutions (VTC especially) are pinned to the campus most students
   * actually travel from — an APPROXIMATION, shown as one on screen.
   */
  district: string;
};

export const INSTITUTIONS: Institution[] = [
  {
    name: "The Chinese University of Hong Kong",
    nameZh: "香港中文大學",
    district: "Sha Tin",
    domains: ["cuhk.edu.hk", "link.cuhk.edu.hk", "scs.cuhk.edu.hk", "stu.scs.cuhk.edu.hk"],
  },
  {
    name: "Vocational Training Council",
    nameZh: "職業訓練局",
    district: "Wan Chai",
    domains: ["vtc.edu.hk", "stu.vtc.edu.hk", "stu.thei.edu.hk", "thei.edu.hk"],
  },
  {
    name: "The Hang Seng University of Hong Kong",
    nameZh: "香港恒生大學",
    district: "Sha Tin",
    domains: ["hsu.edu.hk"],
  },
  {
    name: "Lingnan University",
    nameZh: "嶺南大學",
    district: "Tuen Mun",
    domains: ["ln.hk", "ln.edu.hk"],
  },
  {
    name: "Hong Kong Baptist University",
    nameZh: "香港浸會大學",
    district: "Kowloon Tong",
    domains: ["life.hkbu.edu.hk", "hkbu.edu.hk"],
  },
  {
    name: "The Hong Kong Polytechnic University",
    nameZh: "香港理工大學",
    district: "Hung Hom",
    domains: [
      "connect.polyu.hk",
      "polyu.edu.hk",
      "speed-polyu.edu.hk",
      "cpce-polyu.edu.hk",
      "hkcc-polyu.edu.hk",
      "common.cpce-polyu.edu.hk",
    ],
  },
  {
    name: "The University of Hong Kong",
    nameZh: "香港大學",
    district: "Sai Ying Pun",
    domains: [
      "hku.hk",
      "connect.hku.hk",
      "learner.hkuspace.hku.hk",
      "hkuspace.hku.hk",
      "hkuspace-plk.hku.hk",
      "teacher.hkuspace.hku.hk",
    ],
  },
  {
    name: "The Hong Kong University of Science and Technology",
    nameZh: "香港科技大學",
    district: "Tseung Kwan O",
    domains: ["ust.hk", "connect.ust.hk"],
  },
  {
    name: "Hong Kong Metropolitan University",
    nameZh: "香港都會大學",
    district: "Ho Man Tin",
    domains: ["hkmu.edu.hk", "live.hkmu.edu.hk", "study.hkmu.edu.hk"],
  },
  {
    name: "City University of Hong Kong",
    nameZh: "香港城市大學",
    district: "Kowloon Tong",
    domains: ["my.cityu.edu.hk", "cityu.edu.hk"],
  },
  {
    name: "The Education University of Hong Kong",
    nameZh: "香港教育大學",
    district: "Tai Po",
    domains: ["s.eduhk.hk", "eduhk.hk"],
  },
  {
    name: "Saint Francis University",
    nameZh: "聖方濟各大學",
    district: "Tseung Kwan O",
    domains: [
      "mail.sfu.edu.hk",
      "mail.cbcc.edu.hk",
      "mail.cihe.edu.hk",
      "sfu.edu.hk",
      "caps.cihe.edu.hk",
      "cbcc.edu.hk",
      "cihe.edu.hk",
    ],
  },
];

/** domain -> institution, built once. */
const DOMAIN_INDEX: Record<string, Institution> = (() => {
  const index: Record<string, Institution> = {};
  for (const inst of INSTITUTIONS) {
    for (const domain of inst.domains) index[domain] = inst;
  }
  return index;
})();

export type VerificationResult = {
  eligible: boolean;
  institution: Institution | null;
  domain: string | null;
};

/** Exact / dot-boundary domain match only. */
export function validateInstitutionEmail(email: string): VerificationResult {
  const reject: VerificationResult = { eligible: false, institution: null, domain: null };
  if (typeof email !== "string" || email.split("@").length !== 2) return reject;

  const [local, domainRaw] = email.split("@");
  const domain = domainRaw.trim().toLowerCase();
  if (!local || !domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return reject;
  }

  const institution = DOMAIN_INDEX[domain];
  if (!institution) return reject;
  return { eligible: true, institution, domain };
}

export const TOTAL_DOMAINS = INSTITUTIONS.reduce((n, i) => n + i.domains.length, 0);
