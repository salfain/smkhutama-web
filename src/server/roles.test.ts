/**
 * Audit statis untuk batas wewenang area admin.
 *
 * Guard halaman dan server action sengaja diperiksa dari source karena itulah
 * pengaman yang benar-benar dijalankan Next.js. Tabel izin yang berdiri sendiri
 * bisa tetap hijau walaupun sebuah page.tsx lupa memasang requireAuth.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

type AdminRole = "ADMIN" | "KURIKULUM" | "KESISWAAN" | "ADMIN_CBT";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN_ROOT = join(SRC_ROOT, "app", "admin");

const OWNED_PAGES: Record<AdminRole, readonly string[]> = {
  ADMIN: [
    "access-control",
    "audit-logs",
    "majors",
    "school-profile",
    "settings",
    "students",
    "teachers",
  ],
  KURIKULUM: ["academic-years", "classes", "lesson-schedules", "piket-schedules", "subjects", "teaching-assignments"],
  KESISWAAN: ["achievements", "permits", "tardiness", "violations"],
  ADMIN_CBT: [
    "exams",
    "exams/[id]/print-questions",
    "monitoring",
    "print",
    "question-sets",
    "question-sets/[id]",
    "reports",
    "tokens",
  ],
};

const SHARED_PAGES = ["change-password", "dashboard"] as const;
const ADMIN_ROLES = Object.keys(OWNED_PAGES) as AdminRole[];

const OWNED_ACTIONS: Record<Exclude<AdminRole, "KESISWAAN">, readonly string[]> = {
  ADMIN: ["access-control", "majors", "school-profile", "settings", "students", "teachers"],
  KURIKULUM: ["academic-years", "classes", "lesson-schedules", "piket-schedules", "subjects", "teaching-assignments"],
  ADMIN_CBT: ["exams", "monitoring", "print", "question-sets", "reports", "tokens"],
};

function normalize(path: string) {
  return path.replaceAll("\\", "/");
}

function read(relativePath: string) {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

function readAdminPage(route: string) {
  return read(`app/admin/${route}/page.tsx`);
}

function collectAdminPages(directory = ADMIN_ROOT): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return collectAdminPages(fullPath);
    if (entry.name !== "page.tsx") return [];
    return [normalize(relative(ADMIN_ROOT, dirname(fullPath)))];
  });
}

function firstPageGuard(source: string) {
  const page = source.slice(source.indexOf("export default async function"));
  return page.match(/await (?:requireAuth\([^;]+\)|requireAdminArea\(\))/)?.[0] ?? null;
}

function firstActionGuard(source: string, functionName: string) {
  const start = source.indexOf(`export async function ${functionName}(`);
  assert.notEqual(start, -1, `fungsi ${functionName} tidak ditemukan`);

  const functionSource = source.slice(start);
  const bodyStart = functionSource.indexOf("{");
  assert.notEqual(bodyStart, -1, `body ${functionName} tidak ditemukan`);

  const nextFunction = functionSource.indexOf("\nexport async function", bodyStart);
  const functionBody = functionSource.slice(
    bodyStart + 1,
    nextFunction === -1 ? undefined : nextFunction,
  );

  return (
    functionBody.match(
      /await (?:requireAuth\([^;]+\)|requireAdminArea\(\)|requireCounselorAuth\(\))/,
    )?.[0] ?? null
  );
}

function exportedActionNames(source: string) {
  return [...source.matchAll(/^export async function (\w+)\(/gm)].map((match) => match[1]);
}

describe("matriks wewenang halaman admin", () => {
  test("semua page.tsx tercakup dalam matriks", () => {
    const expected = [...SHARED_PAGES, ...ADMIN_ROLES.flatMap((role) => OWNED_PAGES[role])].sort();
    assert.deepEqual(collectAdminPages().sort(), expected);
  });

  for (const role of ADMIN_ROLES) {
    test(`${role} hanya menjaga halaman miliknya`, () => {
      for (const route of OWNED_PAGES[role]) {
        const source = readAdminPage(route);
        assert.equal(
          firstPageGuard(source),
          `await requireAuth("${role}")`,
          `/admin/${route} harus dijaga ${role}`,
        );

        for (const otherRole of ADMIN_ROLES.filter((candidate) => candidate !== role)) {
          assert.ok(
            !source.includes(`requireAuth("${otherRole}")`),
            `/admin/${route} tidak boleh menerima ${otherRole}`,
          );
        }
      }
    });
  }

  test("halaman bersama hanya menerima keluarga admin", () => {
    for (const route of SHARED_PAGES) {
      assert.equal(
        firstPageGuard(readAdminPage(route)),
        "await requireAdminArea()",
        `/admin/${route} harus memakai gerbang keluarga admin`,
      );
    }
  });
});

describe("matriks wewenang server action admin", () => {
  for (const [role, directories] of Object.entries(OWNED_ACTIONS) as [
    keyof typeof OWNED_ACTIONS,
    readonly string[],
  ][]) {
    test(`semua action ${role} memeriksa ${role} sebagai operasi pertama`, () => {
      for (const directory of directories) {
        const source = read(`app/admin/${directory}/actions.ts`);
        const functionNames = exportedActionNames(source);
        assert.ok(functionNames.length > 0, `${directory}/actions.ts tidak punya fungsi ekspor`);

        for (const functionName of functionNames) {
          assert.equal(
            firstActionGuard(source, functionName),
            `await requireAuth("${role}")`,
            `${directory}.${functionName} harus dijaga ${role}`,
          );
        }
      }
    });
  }

  test("action dashboard memakai gerbang keluarga admin", () => {
    const source = read("app/admin/dashboard/actions.ts");
    for (const functionName of exportedActionNames(source)) {
      assert.equal(
        firstActionGuard(source, functionName),
        "await requireAdminArea()",
        `dashboard.${functionName} harus memakai gerbang keluarga admin`,
      );
    }
  });
});

describe("pemisahan mutasi BK dan Kesiswaan", () => {
  const actions = read("app/counselor/actions.ts");

  for (const functionName of [
    "saveViolation",
    "deleteViolation",
    "saveAchievement",
    "deleteAchievement",
  ]) {
    test(`${functionName} hanya dapat dipanggil KESISWAAN`, () => {
      assert.equal(firstActionGuard(actions, functionName), 'await requireAuth("KESISWAAN")');
    });
  }

  for (const functionName of [
    "listViolationTypes",
    "saveViolationType",
    "deleteViolationType",
  ]) {
    test(`${functionName} tetap menjadi wewenang BK`, () => {
      assert.equal(firstActionGuard(actions, functionName), "await requireCounselorAuth()");
    });
  }

  test("area konselor tetap memakai gerbang COUNSELOR", () => {
    assert.match(read("app/counselor/layout.tsx"), /await requireCounselorAuth\(\)/);
  });
});

describe("sidebar mengikuti matriks halaman", () => {
  const sidebar = read("components/layouts/AdminSidebar.tsx");

  test("identitas sidebar mengikuti peran pengguna", () => {
    for (const [role, label, title] of [
      ["ADMIN", "Administrator", "ADMIN SMK HUTAMA"],
      ["KURIKULUM", "Kurikulum", "KURIKULUM SMK HUTAMA"],
      ["KESISWAAN", "Kesiswaan", "KESISWAAN SMK HUTAMA"],
      ["ADMIN_CBT", "Admin CBT", "ADMIN CBT SMK HUTAMA"],
    ]) {
      assert.match(sidebar, new RegExp(`${role}: "${label}"`));
      assert.match(sidebar, new RegExp(`${role}: "${title}"`));
    }

    assert.match(sidebar, /\{roleLabels\[user\.role\]\}/);
    assert.match(sidebar, /\{roleTitles\[user\.role\]\}/);
  });

  for (const role of ADMIN_ROLES) {
    test(`menu ${role} hanya ditampilkan kepada ${role}`, () => {
      for (const route of OWNED_PAGES[role].filter((path) => !path.includes("[id]"))) {
        const item = new RegExp(
          `href: "/admin/${route}"[^\\n]+roles: \\["${role}"\\]`,
        );
        assert.match(sidebar, item, `menu /admin/${route} harus khusus ${role}`);
      }
    });
  }
});

describe("sistem visual Genesis", () => {
  test("seluruh layout aplikasi internal memakai Genesis, landing tidak", () => {
    for (const layout of [
      "app/admin/layout.tsx",
      "app/teacher/layout.tsx",
      "app/student/layout.tsx",
      "app/counselor/layout.tsx",
      "app/piket/layout.tsx",
      "app/cms/(panel)/layout.tsx",
      "app/login/layout.tsx",
    ]) {
      assert.match(read(layout), /genesis-app/, `${layout} harus memakai sistem visual Genesis`);
    }

    assert.doesNotMatch(read("app/(landing)/layout.tsx"), /genesis-app/);
  });

  test("navigasi mobile memakai bottom bar melayang dan panel akun", () => {
    const bottomNav = read("components/layouts/MobileBottomNav.tsx");
    assert.match(bottomNav, /fixed inset-x-0 bottom-0/);
    assert.match(bottomNav, /aria-label="Navigasi utama"/);
    assert.match(bottomNav, /rounded-full/);

    for (const shell of [
      "components/layouts/GenesisSidebar.tsx",
      "components/layouts/StudentHeader.tsx",
      "components/landing/LandingNavbar.tsx",
    ]) {
      assert.match(read(shell), /MobileBottomNav/, `${shell} harus memakai bottom bar bersama`);
    }

    assert.match(read("components/layouts/GenesisSidebar.tsx"), /AccountControls/);
    assert.match(read("components/layouts/StudentHeader.tsx"), /StudentAccount/);
  });
});
