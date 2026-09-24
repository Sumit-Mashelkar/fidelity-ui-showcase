import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Award, BadgeIndianRupee, CalendarDays, Check, ChevronDown,
  ChevronRight, CircleUserRound, Clock3, Copy, Home, Info, Megaphone,
  MessageCircle, Play, Plus, Search, Send, ShieldCheck, Trophy, Upload,
  Users, Video,
} from "lucide-react";
import judgeImage from "@/assets/judge-manju.jpg";
import winnerRiya from "@/assets/winner-riya.jpg";
import winnerAarav from "@/assets/winner-aarav.jpg";
import winnerNeha from "@/assets/winner-neha.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Feedants Classical Dance Competition" },
      { name: "description", content: "Competition details, dates, winners, rewards and submission information for Feedants Classical Dance." },
      { property: "og:title", content: "Feedants Classical Dance Competition" },
      { property: "og:description", content: "View competition details, important dates, winners and rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompetitionPage,
});

const importantDates = [
  { icon: CalendarDays, label: "Register Before", date: "10 Aug 26", time: "11:50 PM" },
  { icon: Send, label: "Submission Starts", date: "6 Aug 26", time: "04:00 AM" },
  { icon: Upload, label: "Submission Ends", date: "30 Aug 26", time: "11:55 PM" },
  { icon: Trophy, label: "Result Date", date: "1 Sept 26", time: "11:50 PM" },
];

const winners = [
  { name: "Riya Shah", place: "1st Winner", image: winnerRiya },
  { name: "Aarav Mehta", place: "1st Winner", image: winnerAarav },
  { name: "Neha Verma", place: "2nd Winner", image: winnerNeha },
  { name: "Ishita Chopra", place: "3rd Winner", image: winnerRiya },
];

const rewards = [
  ["🏆", "1st Winner", "₹ 550"], ["🥈", "2nd Winner", "₹ 300"],
  ["🥉", "3rd Winner", "₹ 240"], ["☆", "4th Winner", "₹ 200"],
  ["☆", "5th Winner", "₹ 130"], ["☆", "6th Winner", "₹ 80"],
];

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function CompetitionPage() {
  const [language, setLanguage] = useState<"ENG" | "हिंदी">("ENG");
  const [tab, setTab] = useState("About Competition");
  const [copied, setCopied] = useState(false);

  const copyReferral = async () => {
    await navigator.clipboard?.writeText("https://feedants.com/r/referral123");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="app-page">
      <div className="phone-shell">
        <header className="topbar">
          <IconButton label="Go back"><ArrowLeft /></IconButton>
          <span className="back-label">Go back</span>
          <div className="language-switch" aria-label="Language">
            {(["ENG", "हिंदी"] as const).map((item) => (
              <button type="button" key={item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)}>{item}</button>
            ))}
          </div>
        </header>

        <section className="card contest-card">
          <div className="title-row">
            <h1>Feedants Classical Dance</h1>
            <span className="status"><Check /> Registered</span>
          </div>
          <div className="tag-row"><span>Dance</span><span>Multi-Win</span><strong><Trophy /> Winners get certificate</strong></div>
          <div className="stats-grid">
            <div><small>Prize Pool</small><b className="teal">₹ 1,500</b></div>
            <div><small>Entry Fee</small><b>₹ 99</b></div>
            <div className="spots"><strong><Users /> Only 19 spots left</strong><div className="progress"><i /></div><small>1 / 20 Booked</small></div>
          </div>
        </section>

        <section className="card judge-card">
          <img src={judgeImage} width={816} height={816} alt="Judge Manju Dubey" />
          <div className="judge-copy"><small>Judge</small><h2>Manju Dubey</h2><p>Professional Kathak Dancer<br />12+ Years of Experience</p></div>
          <div className="intro"><button type="button" aria-label="Play intro video"><Play /></button><small>Intro Video</small></div>
        </section>

        <section className="countdown"><Clock3 /><b>Registration closes in</b><strong>01d : 06h : 28m : 32s</strong><span><Clock3 /> Hurry up!</span></section>

        <section className="card dates-card">
          <h3>Important Dates</h3>
          <div className="dates-grid">
            {importantDates.map(({ icon: Icon, label, date, time }) => <div className="date-item" key={label}><Icon /><p><small>{label}</small><b>{date}</b><span>{time}</span></p></div>)}
          </div>
        </section>

        <section className="card winners-card">
          <h3>Previous Winners</h3>
          <div className="winner-scroll">
            {winners.map((winner, index) => <article className="winner" key={winner.name}><div className="winner-photo"><img src={winner.image} loading="lazy" width={816} height={816} alt={winner.name} /><span><Play /></span></div><p><b>{winner.name}</b><small>{winner.place}</small></p>{index === winners.length - 1 ? null : null}</article>)}
          </div>
        </section>

        <section className="card about-card">
          <div className="tabs">{["About Competition", "Judging Parameters", "Rules & Eligibility"].map((item) => <button type="button" key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
          <p>{tab === "About Competition" ? "This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance." : tab === "Judging Parameters" ? "Performances are judged on technique, expression, rhythm and presentation." : "Participants of all ages may enter with one original, self-recorded performance."}</p>
          <button type="button" className="view-more">View more <ChevronDown /></button>
        </section>

        <section className="card rewards-card"><h3>Rewards <span>(All Positions)</span></h3>{rewards.map(([icon, label, amount]) => <div className="reward" key={label}><span>{icon}</span><b>{label}</b><strong>{amount}</strong></div>)}</section>

        <aside className="disclaimer"><Info /><b>Disclaimer:</b> Only contributions from paid participants will be considered for judging.</aside>

        <section className="card payment-card">
          <div className="money-video"><span><Play /></span><p><b>How will you receive<br />prize money?</b><small>Watch video to know more</small></p></div>
          <div className="policies"><p><ShieldCheck /> Refund policy</p><p><ShieldCheck /> Secure payments powered by <em>Razorpay</em></p></div>
        </section>

        <section className="referral">
          <Megaphone />
          <div><b>Refer &amp; Earn more discount</b><div className="referral-input"><span>https://feedants.com/r/referral123</span><button type="button" onClick={copyReferral}><Copy /> {copied ? "Copied" : "Copy Link"}</button></div></div>
          <div className="refer-action"><button type="button">Refer Now</button><small>You earn <b>₹10</b> for every signup</small></div>
        </section>

        <button type="button" className="users-row"><MessageCircle /><span><b>Hear From Our Users</b><small>See what participants say about Feedants</small></span><ChevronRight /></button>
        <div className="ad-slot"><Megaphone /> Ad Here</div>
        <button type="button" className="upload-button">Upload Submission<small>Registered</small></button>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <button type="button"><Home /><span>Home</span></button>
          <button type="button"><Search /><span>Explore</span></button>
          <button type="button" className="add"><Plus /><span className="sr-only">Add</span></button>
          <button type="button" className="selected"><Trophy /><span>Competitions</span></button>
          <button type="button"><CircleUserRound /><span>Profile</span></button>
        </nav>
      </div>
    </main>
  );
}