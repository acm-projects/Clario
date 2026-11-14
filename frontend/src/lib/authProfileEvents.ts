/** Local profiles have no relationship to Supabase browser auth events. */
export function shouldReloadAuthProfile(devBypass: boolean, event: string, currentUserId: string | null, nextUserId: string | null): boolean {
  if (devBypass) return false;
  return event === "SIGNED_OUT" || event === "SIGNED_IN" && nextUserId !== currentUserId;
}
