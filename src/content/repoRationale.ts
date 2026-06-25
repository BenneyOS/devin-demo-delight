import type { ContentItem } from './schema';

export const repoRationaleContent: ContentItem[] = [
  {
    id: "repo-opening-move",
    module: "repo-rationale",
    type: "story-beat",
    title: "The Opening Move — State the Assumption",
    body: "\"CBA understandably doesn't open-source its banking code, so I can't demo on your actual repos. What I can do is pick the closest public proxy and be transparent about why — because choosing the right pilot target is exactly the qualification work we'd do together in a real engagement. Here's my reasoning.\"\n\nThis does three things: it's honest (CISO trust), it demonstrates use-case qualification (a named JD behavior), and it pre-empts the obvious objection ('that's not our code').",
    persona: ["CTO", "CIO", "Security"],
    tags: ["repo-rationale", "opening", "credibility"],
    confidence: "verified",
    source: null,
    dateAdded: "2026-06-25"
  },
  {
    id: "selection-criteria",
    module: "repo-rationale",
    type: "fact",
    title: "Selection Criteria for a CBA Proxy",
    body: "A good proxy must match on:\n1. Same framework + migration shape — Angular/TypeScript, with real upgrade pressure\n2. Security-critical domain — correctness and auditability non-negotiable\n3. Polyglot, multi-app estate — banks run many languages\n4. Mature engineering hygiene — CI/CD, automated dependency management, audit tooling\n5. Public and legible — interviewers can inspect the work and the PR",
    persona: ["CTO", "CIO"],
    tags: ["repo-rationale", "criteria", "methodology"],
    confidence: "verified",
    source: null,
    dateAdded: "2026-06-25"
  },
  {
    id: "bitwarden-framework-match",
    module: "repo-rationale",
    type: "fact",
    title: "Bitwarden: Framework Match",
    body: "`clients` is a TypeScript/Angular monorepo (Nx-managed) — web vault, browser extension, desktop (Electron), CLI. Angular is a listed top topic of the Bitwarden org. Directly maps to the Angular-upgrade use case.",
    persona: ["CTO"],
    tags: ["repo-rationale", "bitwarden", "angular", "typescript"],
    confidence: "verified",
    source: { label: "github.com/bitwarden", url: "https://github.com/bitwarden/clients" },
    dateAdded: "2026-06-25"
  },
  {
    id: "bitwarden-upgrade-pressure",
    module: "repo-rationale",
    type: "fact",
    title: "Bitwarden: Live Upgrade Pressure",
    body: "~13k stars, ~457 open PRs, an active Renovate dependency dashboard batching framework/dependency upgrades around Angular 18→19. This is the never-ending-upgrade treadmill made visible — the exact pain.",
    persona: ["CTO", "CIO"],
    tags: ["repo-rationale", "bitwarden", "renovate", "upgrade-pressure"],
    confidence: "verified",
    source: { label: "github.com/bitwarden", url: "https://github.com/bitwarden/clients" },
    dateAdded: "2026-06-25"
  },
  {
    id: "bitwarden-security-critical",
    module: "repo-rationale",
    type: "fact",
    title: "Bitwarden: Security-Critical Like a Bank",
    body: "Open-source, zero-knowledge, end-to-end encrypted (AES-256 / PBKDF2), security-certified, self-hostable. If autonomous AI can be trusted to upgrade a password manager, the 'but our code is sensitive' objection weakens considerably.",
    persona: ["Security", "CTO"],
    tags: ["repo-rationale", "bitwarden", "security", "encryption"],
    confidence: "verified",
    source: { label: "github.com/bitwarden", url: "https://github.com/bitwarden/clients" },
    dateAdded: "2026-06-25"
  },
  {
    id: "bitwarden-polyglot",
    module: "repo-rationale",
    type: "fact",
    title: "Bitwarden: Polyglot Estate Like CBA",
    body: "The Bitwarden org spans 67 repos across C#/.NET (server), Kotlin (Android), Swift (iOS), Rust (sdk-internal), TypeScript/Angular (clients) — a realistic analogue for a bank's mixed estate, and a natural bridge to the land-and-expand story (Angular today → .NET/Java/test-coverage tomorrow).",
    persona: ["CTO", "CIO"],
    tags: ["repo-rationale", "bitwarden", "polyglot", "land-and-expand"],
    confidence: "verified",
    source: { label: "github.com/bitwarden", url: "https://github.com/bitwarden" },
    dateAdded: "2026-06-25"
  },
  {
    id: "bitwarden-audit-tooling",
    module: "repo-rationale",
    type: "fact",
    title: "Bitwarden: Audit Tooling Built In",
    body: "The org ships a Splunk app for event-log reporting — a shop that already thinks in audit trails and SIEM, exactly like CBA's security function. Great hook for the compliance persona.",
    persona: ["Security"],
    tags: ["repo-rationale", "bitwarden", "splunk", "audit"],
    confidence: "verified",
    source: { label: "github.com/bitwarden", url: "https://github.com/bitwarden" },
    dateAdded: "2026-06-25"
  },
  {
    id: "bitwarden-mature-hygiene",
    module: "repo-rationale",
    type: "fact",
    title: "Bitwarden: Mature Engineering Hygiene",
    body: "Automated CI/CD, Renovate, CODEOWNERS-based review — the demo shows Devin slotting into a governed workflow, not a greenfield free-for-all.",
    persona: ["CTO", "Security"],
    tags: ["repo-rationale", "bitwarden", "ci-cd", "governance"],
    confidence: "verified",
    source: { label: "github.com/bitwarden", url: "https://github.com/bitwarden/clients" },
    dateAdded: "2026-06-25"
  },
  {
    id: "cba-mapping-table",
    module: "repo-rationale",
    type: "fact",
    title: "CBA → Bitwarden Mapping Table",
    body: "| CBA Reality | Bitwarden Proxy | What Demo Proves |\n|---|---|---|\n| Large Angular/TS customer-facing surfaces | Angular/TS monorepo | Devin handles the framework CBA actually uses |\n| Security & auditability non-negotiable (APRA CPS 234) | Zero-knowledge security product + Splunk audit | Autonomous upgrade with full review trail in a sensitive codebase |\n| Mixed-language estate (mainframe→modern) | 67 repos across C#/Kotlin/Swift/Rust/TS | Land on Angular, expand across the estate (MultiDevin) |\n| Mandatory, repeatable version currency | Renovate treadmill, Angular 18→19→20 | The repeatable, outcome-shaped work the guarantee can measure |",
    persona: ["CTO", "CIO", "Security"],
    tags: ["repo-rationale", "mapping", "cba-proxy"],
    confidence: "verified",
    source: null,
    dateAdded: "2026-06-25"
  },
  {
    id: "use-case-scope",
    module: "repo-rationale",
    type: "fact",
    title: "Use Case & Scope",
    body: "**Use case:** Angular version upgrade — lower-risk, high-frequency 'land' motion; expands to Java/test-coverage/broader modernisation.\n\n**Live scope:** Scoped Angular web-vault workspace (controlled, repeatable, reliable on the day).\n\n**Narrative scope:** MultiDevin parallelising across all workspaces/repos — the portfolio vision and non-linear-scaling proof.\n\n**Tie to guarantee:** 'This single upgrade is one measurable unit. Now picture it dashboarded across your whole estate, with the value guaranteed to break even or you're credited the difference.'",
    persona: ["CTO", "CIO"],
    tags: ["repo-rationale", "scope", "use-case", "land-and-expand"],
    confidence: "verified",
    source: null,
    dateAdded: "2026-06-25"
  }
];
