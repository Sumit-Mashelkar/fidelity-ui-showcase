import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronRight, CircleUserRound, Clock3, Copy, Home, Info, LoaderCircle, LockKeyhole, LogIn, Megaphone, MessageCircle, Play, Plus, Search, Send, ShieldCheck, Trophy, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getCompetition, getMyCompetitionState, registerForCompetition, submitCompetitionEntry, withdrawFromCompetition } from "@/lib/competition.functions";
import judgeImage from "@/assets/judge-manju.jpg";
import winnerRiya from "@/assets/winner-riya.jpg";
import winnerAarav from "@/assets/winner-aarav.jpg";
import winnerNeha from "@/assets/winner-neha.jpg";

const slug = "feedants-classical-dance";
const competitionQuery = queryOptions({ queryKey: ["competition", slug], queryFn: () => getCompetition({ data: { slug } }), staleTime: 15_000 });
const imageMap: Record<string, string> = { "judge-manju": judgeImage, "winner-riya": winnerRiya, "winner-aarav": winnerAarav, "winner-neha": winnerNeha };
const dateMeta = [
  [CalendarDays, "Register Before", "registration_closes_at"], [Send, "Submission Starts", "submission_opens_at"],
  [Upload, "Submission Ends", "submission_closes_at"], [Trophy, "Result Date", "results_at"],
] as const;
const errorCopy: Record<string, string> = { AUTH_REQUIRED: "Please sign in first.", REGISTRATION_NOT_OPEN: "Registration has not opened yet.", REGISTRATION_CLOSED: "Registration is closed.", COMPETITION_FULL: "All available spots have been filled.", SUBMISSIONS_NOT_OPEN: "Submissions have not opened yet.", SUBMISSIONS_CLOSED: "Submissions are closed.", REGISTRATION_REQUIRED: "Register before submitting an entry.", PAYMENT_REQUIRED: "Payment must be completed before submission." };

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(competitionQuery),
  head: () => ({ meta: [
    { title: "Feedants Classical Dance Competition" }, { name: "description", content: "Live competition details, dates, availability, winners and rewards." },
    { property: "og:title", content: "Feedants Classical Dance Competition" }, { property: "og:description", content: "View live competition details, availability, dates and rewards." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CompetitionPage,
  errorComponent: () => <PageState title="Competition unavailable" copy="We couldn't load this competition. Please try again shortly." />,
  notFoundComponent: () => <PageState title="Competition not found" copy="This competition is no longer available." />,
});

function PageState({ title, copy }: { title: string; copy: string }) { return <main className="app-page"><div className="page-state"><Trophy /><h1>{title}</h1><p>{copy}</p></div></main>; }
function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) { return <Button type="button" variant="ghost" size="icon" className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</Button>; }
function money(paise: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100); }
function dateParts(value: string) { const date = new Date(value); return { date: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Kolkata" }).format(date), time: new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(date) }; }
function countdown(target: string, now: number) { const distance = Math.max(Date.parse(target) - now, 0); const days = Math.floor(distance / 86_400_000); const hours = Math.floor(distance / 3_600_000) % 24; const minutes = Math.floor(distance / 60_000) % 60; const seconds = Math.floor(distance / 1000) % 60; return `${String(days).padStart(2,"0")}d : ${String(hours).padStart(2,"0")}h : ${String(minutes).padStart(2,"0")}m : ${String(seconds).padStart(2,"0")}s`; }
function friendlyError(error: unknown) { const message = error instanceof Error ? error.message : "Something went wrong."; const key = Object.keys(errorCopy).find((item) => message.includes(item)); return key ? (errorCopy[key] ?? "That action could not be completed. Please try again.") : "That action could not be completed. Please try again."; }

function CompetitionPage() {
  const { data } = useSuspenseQuery(competitionQuery);
  const router = useRouter();
  const queryClient = useQueryClient();
  const getMyState = useServerFn(getMyCompetitionState);
  const register = useServerFn(registerForCompetition);
  const withdraw = useServerFn(withdrawFromCompetition);
  const submitEntry = useServerFn(submitCompetitionEntry);
  const [language, setLanguage] = useState<"ENG" | "हिंदी">("ENG");
  const [tab, setTab] = useState("About Competition");
  const [userId, setUserId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [mediaUrl, setMediaUrl] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: auth }) => setUserId(auth.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => { if (["SIGNED_IN","SIGNED_OUT","USER_UPDATED"].includes(event)) setUserId(session?.user.id ?? null); });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!data) return;
    const channel = supabase.channel(`competition-${data.competition.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "competitions", filter: `id=eq.${data.competition.id}` }, () => queryClient.invalidateQueries({ queryKey: ["competition", slug] })).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [data, queryClient]);

  const myStateQuery = useQuery({ queryKey: ["my-competition", data?.competition.id, userId], queryFn: () => getMyState({ data: { competitionId: data?.competition.id ?? "" } }), enabled: Boolean(userId && data), retry: false });
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["competition", slug] }), queryClient.invalidateQueries({ queryKey: ["my-competition"] })]); };
  const registerMutation = useMutation({ mutationFn: () => register({ data: { competitionId: data?.competition.id ?? "" } }), onSuccess: async () => { setNotice("Registration confirmed."); await refresh(); }, onError: (error) => setNotice(friendlyError(error)) });
  const withdrawMutation = useMutation({ mutationFn: () => withdraw({ data: { competitionId: data?.competition.id ?? "" } }), onSuccess: async () => { setNotice("Registration withdrawn."); await refresh(); }, onError: (error) => setNotice(friendlyError(error)) });
  const submitMutation = useMutation({ mutationFn: () => submitEntry({ data: { competitionId: data?.competition.id ?? "", mediaUrl } }), onSuccess: async () => { setSubmitOpen(false); setNotice("Submission saved."); await refresh(); }, onError: (error) => setNotice(friendlyError(error)) });

  if (!data) return <PageState title="Competition not found" copy="This competition is no longer available." />;
  const { competition, judge, rewards, winners } = data;
  const remaining = Math.max(competition.capacity - competition.booked_count, 0);
  const lifecycle = competition.publication_status === "cancelled" ? "cancelled" : now < Date.parse(competition.registration_opens_at) ? "upcoming" : now < Date.parse(competition.registration_closes_at) ? (remaining === 0 ? "full" : "registration_open") : now < Date.parse(competition.submission_opens_at) ? "registration_closed" : now < Date.parse(competition.submission_closes_at) ? "submissions_open" : now < Date.parse(competition.results_at) ? "judging" : "completed";
  const registration = myStateQuery.data?.registration;
  const registered = registration?.status === "confirmed";
  const activeText = tab === "About Competition" ? competition.about : tab === "Judging Parameters" ? competition.judging_parameters : competition.rules_eligibility;
  const registrationTarget = lifecycle === "upcoming" ? competition.registration_opens_at : competition.registration_closes_at;
  const lifecycleLabel: Record<string,string> = { upcoming:"Registration opens in", registration_open:"Registration closes in", full:"Registration full", registration_closed:"Registration closed", submissions_open:"Submissions close in", judging:"Results in", completed:"Results declared", cancelled:"Competition cancelled" };
  const timerTarget = lifecycle === "submissions_open" ? competition.submission_closes_at : lifecycle === "judging" ? competition.results_at : registrationTarget;
  const action = () => {
    setNotice(null);
    if (!userId) { setAuthOpen(true); return; }
    if (registered) { if (lifecycle === "submissions_open") setSubmitOpen(true); else withdrawMutation.mutate(); return; }
    registerMutation.mutate();
  };
  const actionDisabled = registered
    ? lifecycle !== "registration_open" && lifecycle !== "submissions_open"
    : lifecycle !== "registration_open";
  const actionLabel = registerMutation.isPending || withdrawMutation.isPending ? "Please wait…" : registered ? lifecycle === "submissions_open" ? (myStateQuery.data?.submission ? "Update Submission" : "Upload Submission") : lifecycle === "registration_open" ? "Withdraw Registration" : "Registered" : lifecycle === "full" ? "Competition Full" : lifecycle === "upcoming" ? "Registration Opens Soon" : lifecycle === "registration_open" ? "Register Now" : "Registration Closed";

  const handleEmailAuth = async () => {
    setNotice(null);
    const result = authMode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setNotice(result.error.message); return; }
    if (!result.data.session) setNotice("Check your email to confirm your account."); else { setAuthOpen(false); setNotice("Signed in successfully."); }
  };
  const handleGoogle = async () => { const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (result.error) setNotice(result.error.message); };
  const copyReferral = async () => { await navigator.clipboard?.writeText(`${window.location.origin}/?ref=${userId ?? "guest"}`); setNotice("Referral link copied."); };

  return <main className="app-page"><div className="phone-shell">
    <header className="topbar"><IconButton label="Go back" onClick={() => router.history.back()}><ArrowLeft /></IconButton><span className="back-label">Go back</span><div className="language-switch" aria-label="Language">{(["ENG","हिंदी"] as const).map(item => <Button variant="ghost" type="button" key={item} className={language===item?"active":""} onClick={()=>setLanguage(item)}>{item}</Button>)}</div></header>
    {notice && <div className="notice" role="status"><Info />{notice}<IconButton label="Dismiss" onClick={()=>setNotice(null)}><X /></IconButton></div>}
    <section className="card contest-card"><div className="title-row"><h1>{competition.title}</h1>{registered ? <button type="button" className="status" onClick={action}><Check /> Registered</button> : <button type="button" className="status status-action" disabled={actionDisabled} onClick={action}><LogIn />{lifecycle === "registration_open" ? "Register" : lifecycleLabel[lifecycle]}</button>}</div><div className="tag-row"><span>{competition.category}</span><span>{competition.format_label}</span>{competition.certificate_enabled && <strong><Trophy /> Winners get certificate</strong>}</div><div className="stats-grid"><div><small>Prize Pool</small><b className="teal">{money(competition.prize_pool_paise)}</b></div><div><small>Entry Fee</small><b>{money(competition.entry_fee_paise)}</b></div><div className="spots"><strong><Users /> {remaining === 0 ? "No spots left" : `Only ${remaining} spots left`}</strong><div className="progress"><i style={{ width: `${Math.min(competition.booked_count / competition.capacity * 100,100)}%` }} /></div><small>{competition.booked_count} / {competition.capacity} Booked</small></div></div></section>
    {judge && <section className="card judge-card"><img src={imageMap[judge.image_key] ?? judgeImage} width={816} height={816} alt={`Judge ${judge.name}`} /><div className="judge-copy"><small>Judge</small><h2>{judge.name}</h2><p>{judge.title}<br />{judge.experience}</p></div><div className="intro"><Button variant="ghost" type="button" aria-label="Play intro video" disabled={!judge.intro_video_url}><Play /></Button><small>Intro Video</small></div></section>}
    <section className={`countdown countdown-${lifecycle}`}><Clock3 /><b>{lifecycleLabel[lifecycle]}</b><strong>{["upcoming","registration_open","submissions_open","judging"].includes(lifecycle) ? countdown(timerTarget,now) : lifecycleLabel[lifecycle]}</strong><span><Clock3 /> {lifecycle === "registration_open" ? "Hurry up!" : "Live status"}</span></section>
    <section className="card dates-card"><h3>Important Dates</h3><div className="dates-grid">{dateMeta.map(([Icon,label,key])=>{const value=dateParts(competition[key]);return <div className="date-item" key={label}><Icon/><p><small>{label}</small><b>{value.date}</b><span>{value.time}</span></p></div>})}</div></section>
    <section className="card winners-card"><h3>Previous Winners</h3><div className="winner-scroll">{winners.map(winner=><article className="winner" key={winner.id}><div className="winner-photo"><img src={imageMap[winner.image_key] ?? winnerRiya} loading="lazy" width={816} height={816} alt={winner.display_name}/><span><Play/></span></div><p><b>{winner.display_name}</b><small>{winner.placement_label}</small></p></article>)}</div></section>
    <section className="card about-card"><div className="tabs">{["About Competition","Judging Parameters","Rules & Eligibility"].map(item=><Button variant="ghost" type="button" key={item} className={tab===item?"active":""} onClick={()=>setTab(item)}>{item}</Button>)}</div><p>{activeText}</p><Button variant="ghost" type="button" className="view-more">View more <ChevronDown/></Button></section>
    <section className="card rewards-card"><h3>Rewards <span>(All Positions)</span></h3>{rewards.map(reward=><div className="reward" key={reward.id}><span>{reward.icon === "trophy" ? "🏆" : reward.icon === "medal" ? "🥈" : "☆"}</span><b>{reward.label}</b><strong>{money(reward.amount_paise)}</strong></div>)}</section>
    <aside className="disclaimer"><Info/><b>Disclaimer:</b>{competition.disclaimer}</aside>
    <section className="card payment-card"><div className="money-video"><span><Play/></span><p><b>How will you receive<br/>prize money?</b><small>Watch video to know more</small></p></div><div className="policies"><p><ShieldCheck/> Refund policy</p><p><ShieldCheck/> Secure payments powered by <em>Razorpay</em></p></div></section>
    <section className="referral"><Megaphone/><div><b>Refer &amp; Earn more discount</b><div className="referral-input"><span>{`${typeof window === "undefined" ? "feedants.com" : window.location.host}/?ref=${userId ?? "guest"}`}</span><Button variant="ghost" type="button" onClick={copyReferral}><Copy/>Copy Link</Button></div></div><div className="refer-action"><Button type="button" onClick={copyReferral}>Refer Now</Button><small>You earn <b>{money(competition.referral_reward_paise)}</b> for every signup</small></div></section>
    <Button variant="outline" type="button" className="users-row"><MessageCircle/><span><b>Hear From Our Users</b><small>See what participants say about Feedants</small></span><ChevronRight/></Button><div className="ad-slot"><Megaphone/> Ad Here</div>
    <Button type="button" className="upload-button" disabled={actionDisabled || registerMutation.isPending || withdrawMutation.isPending} onClick={action}>{actionLabel}<small>{registered ? myStateQuery.data?.submission?.status ?? "Registered" : lifecycleLabel[lifecycle]}</small></Button>
    <nav className="bottom-nav" aria-label="Primary navigation"><Button variant="ghost"><Home/><span>Home</span></Button><Button variant="ghost"><Search/><span>Explore</span></Button><Button variant="ghost" className="add"><Plus/><span className="sr-only">Add</span></Button><Button variant="ghost" className="selected"><Trophy/><span>Competitions</span></Button><Button variant="ghost" onClick={()=>!userId&&setAuthOpen(true)}><CircleUserRound/><span>{userId?"Profile":"Sign in"}</span></Button></nav>
    {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={()=>setAuthOpen(false)}><section className="action-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={e=>e.stopPropagation()}><IconButton label="Close" onClick={()=>setAuthOpen(false)}><X/></IconButton><LockKeyhole/><h2 id="auth-title">{authMode === "signin" ? "Sign in to participate" : "Create your account"}</h2><p>Your account keeps registrations and submissions linked to you.</p><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={authMode === "signin" ? "current-password" : "new-password"}/></label><Button type="button" onClick={handleEmailAuth} disabled={!email || password.length < 6}>{authMode === "signin" ? "Sign in" : "Create account"}</Button><Button variant="outline" type="button" onClick={handleGoogle}>Continue with Google</Button><Button variant="link" type="button" onClick={()=>setAuthMode(authMode === "signin" ? "signup" : "signin")}>{authMode === "signin" ? "New here? Create an account" : "Already registered? Sign in"}</Button></section></div>}
    {submitOpen && <div className="modal-backdrop" role="presentation" onMouseDown={()=>setSubmitOpen(false)}><section className="action-modal" role="dialog" aria-modal="true" aria-labelledby="submit-title" onMouseDown={e=>e.stopPropagation()}><IconButton label="Close" onClick={()=>setSubmitOpen(false)}><X/></IconButton><Upload/><h2 id="submit-title">Submit your performance</h2><p>Add the secure link to your uploaded dance video.</p><label>Video URL<input type="url" placeholder="https://…" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)}/></label><Button type="button" onClick={()=>submitMutation.mutate()} disabled={!mediaUrl || submitMutation.isPending}>{submitMutation.isPending?<><LoaderCircle className="spin"/>Saving…</>:"Save submission"}</Button></section></div>}
  </div></main>;
}