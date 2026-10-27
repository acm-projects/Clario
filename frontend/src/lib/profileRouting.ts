// Retake permission lives only in memory, is bound to the user, and is never a URL flag.
export function createRetakeAccess() {
  let grant: { userId: string; token: string } | null = null;
  return {
    start(userId: string) {
      grant = { userId, token: crypto.randomUUID() };
      return { retakeToken: grant.token };
    },
    allows(userId: string, state: unknown) {
      return !!grant && grant.userId === userId && typeof state === "object" && state !== null && "retakeToken" in state && state.retakeToken === grant.token;
    },
    clear() { grant = null; },
  };
}

export function getProfileRedirect(pathname: string, completed: boolean | null, retakeAllowed: boolean): string | null {
  const isAssessment = pathname.toLowerCase() === "/assessment";
  if (completed !== true && !isAssessment) return "/assessment";
  if (completed === true && isAssessment && !retakeAllowed) return "/dashboard";
  return null;
}
