import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { isAuthDisabled } from "../../shared/dev-auth";
import { ensureDevUser } from "./dev-user";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  if (!user && isAuthDisabled()) {
    user = await ensureDevUser();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
