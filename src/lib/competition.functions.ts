import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const slugSchema = z.object({ slug: z.string().min(1).max(120) });
const competitionIdSchema = z.object({ competitionId: z.string().uuid() });
const submissionSchema = competitionIdSchema.extend({ mediaUrl: z.string().url().max(2048) });

function createPublicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("The competition service is not configured.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

function lifecycle(c: Database["public"]["Tables"]["competitions"]["Row"], now: Date) {
  if (c.publication_status === "cancelled") return "cancelled";
  if (c.publication_status === "archived") return "completed";
  const time = now.getTime();
  if (time < Date.parse(c.registration_opens_at)) return "upcoming";
  if (time < Date.parse(c.registration_closes_at)) return c.booked_count >= c.capacity ? "full" : "registration_open";
  if (time < Date.parse(c.submission_opens_at)) return "registration_closed";
  if (time < Date.parse(c.submission_closes_at)) return "submissions_open";
  if (time < Date.parse(c.results_at)) return "judging";
  return "completed";
}

export const getCompetition = createServerFn({ method: "GET" })
  .inputValidator((input) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const db = createPublicClient();
    const { data: competition, error } = await db.from("competitions").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error("Competition details could not be loaded.");
    if (!competition) return null;
    const [judgeResult, rewardsResult, winnersResult] = await Promise.all([
      competition.judge_id ? db.from("judges").select("*").eq("id", competition.judge_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      db.from("competition_rewards").select("*").eq("competition_id", competition.id).order("rank"),
      db.from("competition_winners").select("*").eq("competition_id", competition.id).order("display_order"),
    ]);
    if (judgeResult.error || rewardsResult.error || winnersResult.error) throw new Error("Competition details could not be loaded.");
    const now = new Date();
    return {
      competition,
      judge: judgeResult.data,
      rewards: rewardsResult.data ?? [],
      winners: winnersResult.data ?? [],
      serverNow: now.toISOString(),
      lifecycle: lifecycle(competition, now),
      remainingSpots: Math.max(competition.capacity - competition.booked_count, 0),
    };
  });

export const getMyCompetitionState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => competitionIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: registration, error } = await context.supabase.from("competition_registrations").select("*").eq("competition_id", data.competitionId).eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Your participation status could not be loaded.");
    const { data: submission, error: submissionError } = registration
      ? await context.supabase.from("competition_submissions").select("*").eq("registration_id", registration.id).maybeSingle()
      : { data: null, error: null };
    if (submissionError) throw new Error("Your submission status could not be loaded.");
    return { registration, submission };
  });

export const registerForCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => competitionIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: registration, error } = await context.supabase.rpc("register_for_competition", { _competition_id: data.competitionId });
    if (error) throw new Error(error.message);
    return registration;
  });

export const withdrawFromCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => competitionIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: withdrawn, error } = await context.supabase.rpc("withdraw_from_competition", { _competition_id: data.competitionId });
    if (error) throw new Error(error.message);
    return { withdrawn };
  });

export const submitCompetitionEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => submissionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: submission, error } = await context.supabase.rpc("submit_competition_entry", { _competition_id: data.competitionId, _media_url: data.mediaUrl });
    if (error) throw new Error(error.message);
    return submission;
  });