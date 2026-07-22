import { describe, expect, it } from "vitest";
import {
  isLegacySessionWithoutOrgs,
  resolveTenantReady,
} from "@/lib/security/tenant-ready";

describe("tenant-ready (compat API legada)", () => {
  it("detecta sessão antiga sem campo organizations", () => {
    expect(
      isLegacySessionWithoutOrgs({
        user: { id: 1 },
        perfil: {},
        isAdmin: false,
      }),
    ).toBe(true);
  });

  it("sessão nova com organizations=[] não é legada", () => {
    expect(
      isLegacySessionWithoutOrgs({
        user: { id: 1 },
        organizations: [],
        activeOrganizationId: null,
        activeRole: null,
      }),
    ).toBe(false);
  });

  it("tenantReady true na API legada autenticada", () => {
    expect(
      resolveTenantReady({
        session: { user: { id: 1 }, isAdmin: false },
        activeOrganizationId: null,
      }),
    ).toBe(true);
  });

  it("tenantReady exige org na API nova", () => {
    expect(
      resolveTenantReady({
        session: {
          user: { id: 1 },
          organizations: [],
          activeOrganizationId: null,
        },
        activeOrganizationId: null,
      }),
    ).toBe(false);
    expect(
      resolveTenantReady({
        session: {
          user: { id: 1 },
          organizations: [{ id: 9 }],
          activeOrganizationId: 9,
        },
        activeOrganizationId: 9,
      }),
    ).toBe(true);
  });
});
