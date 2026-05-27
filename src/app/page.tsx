"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Theme = "light" | "dark";
type View = "landing" | "finder";
type CreditScore = "unknown" | "below_650" | "650_749" | "750_plus";
type TravelFrequency = "rare" | "occasional" | "frequent";
type FeePreference = "free" | "low" | "premium";
type Goal = "cashback" | "rewards" | "travel";
type SpendingKey = "online" | "dining" | "groceries" | "fuel" | "utilities" | "travel" | "other";
type Spending = Record<SpendingKey, number>;

type Card = {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  annualFeeWaiver: number;
  rewardType: Goal;
  rewardRates: Partial<Record<SpendingKey, number>>;
  loungeAccess: number;
  minIncome: number;
  minScore: CreditScore;
  accent: string;
};

const scoreOrder: Record<CreditScore, number> = { unknown: 0, below_650: 1, "650_749": 2, "750_plus": 3 };
const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

const cards: Card[] = [
  { id: "hdfc-millennia", name: "HDFC Millennia", issuer: "HDFC Bank", annualFee: 1000, annualFeeWaiver: 100000, rewardType: "cashback", rewardRates: { online: 5, dining: 2, groceries: 1, other: 1 }, loungeAccess: 4, minIncome: 35000, minScore: "650_749", accent: "from-cyan-500 to-blue-600" },
  { id: "amazon-icici", name: "Amazon Pay ICICI", issuer: "ICICI Bank", annualFee: 0, annualFeeWaiver: 0, rewardType: "cashback", rewardRates: { online: 5, dining: 1, groceries: 1, other: 1 }, loungeAccess: 0, minIncome: 25000, minScore: "650_749", accent: "from-indigo-500 to-violet-600" },
  { id: "axis-ace", name: "Axis Ace", issuer: "Axis Bank", annualFee: 0, annualFeeWaiver: 0, rewardType: "cashback", rewardRates: { utilities: 5, online: 2, groceries: 2, dining: 2, other: 1 }, loungeAccess: 0, minIncome: 30000, minScore: "650_749", accent: "from-emerald-500 to-teal-600" },
  { id: "hdfc-regalia-gold", name: "HDFC Regalia Gold", issuer: "HDFC Bank", annualFee: 2500, annualFeeWaiver: 400000, rewardType: "travel", rewardRates: { travel: 5, dining: 5, online: 2, other: 1 }, loungeAccess: 12, minIncome: 80000, minScore: "750_plus", accent: "from-amber-500 to-orange-600" },
  { id: "sbi-elite", name: "SBI Elite", issuer: "SBI Card", annualFee: 4999, annualFeeWaiver: 500000, rewardType: "travel", rewardRates: { travel: 5, dining: 5, online: 2, other: 1 }, loungeAccess: 10, minIncome: 100000, minScore: "750_plus", accent: "from-fuchsia-500 to-pink-600" },
];

const spendQuestions: { key: SpendingKey; label: string; hint: string; accent: string }[] = [
  { key: "online", label: "Online shopping", hint: "Amazon, Flipkart, Myntra", accent: "from-violet-500 to-indigo-600" },
  { key: "dining", label: "Dining & cafes", hint: "Restaurants, quick meals", accent: "from-rose-500 to-orange-500" },
  { key: "groceries", label: "Groceries", hint: "Supermarket & local stores", accent: "from-emerald-500 to-teal-600" },
  { key: "fuel", label: "Fuel", hint: "Petrol, diesel, EV charging", accent: "from-amber-500 to-yellow-500" },
  { key: "utilities", label: "Utilities", hint: "Electricity, mobile, internet", accent: "from-sky-500 to-cyan-600" },
  { key: "travel", label: "Travel", hint: "Flights, hotels, cabs", accent: "from-blue-500 to-indigo-700" },
  { key: "other", label: "Other expenses", hint: "Everything else", accent: "from-slate-500 to-slate-700" },
];

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState(60000);
  const [score, setScore] = useState<CreditScore>("650_749");
  const [goal, setGoal] = useState<Goal>("cashback");
  const [fee, setFee] = useState<FeePreference>("low");
  const [travelFrequency, setTravelFrequency] = useState<TravelFrequency>("occasional");
  const [loungeImportance, setLoungeImportance] = useState(3);
  const [spending, setSpending] = useState<Spending>({ online: 12000, dining: 5000, groceries: 7000, fuel: 3000, utilities: 2500, travel: 6000, other: 4500 });

  const revealRefs = useRef<(HTMLElement | null)[]>([]);
  const totalSteps = 6 + spendQuestions.length;
  const spendIndex = step - 3;
  const totalMonthlySpend = useMemo(() => Object.values(spending).reduce((a, b) => a + b, 0), [spending]);

  useEffect(() => {
    const saved = window.localStorage.getItem("cardnest-theme") as Theme | null;
    const next = saved ?? "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("show"));
    }, { threshold: 0.2 });
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [view]);

  const ranked = useMemo(() => {
    return cards
      .map((card) => {
        if (income < card.minIncome) return null;
        if (score !== "unknown" && scoreOrder[score] < scoreOrder[card.minScore]) return null;
        const annualSpend = totalMonthlySpend * 12;
        const rewards = spendQuestions.reduce((sum, q) => sum + spending[q.key] * 12 * ((card.rewardRates[q.key] ?? 1) / 100), 0);
        const feePaid = card.annualFeeWaiver > 0 && annualSpend >= card.annualFeeWaiver ? 0 : card.annualFee;
        const loungeUnit = travelFrequency === "rare" ? 80 : travelFrequency === "occasional" ? 150 : 250;
        const loungeValue = card.loungeAccess * loungeUnit * (loungeImportance / 5);
        const fit = card.rewardType === goal ? 100 : 74;
        const feeScore = fee === "free" ? Math.max(0, 100 - card.annualFee / 50) : fee === "low" ? Math.max(0, 100 - card.annualFee / 100) : Math.min(100, 55 + card.annualFee / 120);
        const totalScore = Math.round(fit * 0.4 + feeScore * 0.25 + Math.min(100, loungeValue / 28) * 0.2 + 15);
        return { card, totalScore: Math.min(99, totalScore), annualRewards: Math.round(rewards), annualBenefit: Math.round(rewards + loungeValue - feePaid), feePaid };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 4);
  }, [fee, goal, income, loungeImportance, score, spending, totalMonthlySpend, travelFrequency]);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("cardnest-theme", next);
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-7xl">
        <header className="panel mb-6 rounded-[30px] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BadgeIcon />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-500">Card Recommendation Engine</p>
                <h1 className="mt-1 text-4xl font-semibold tracking-tight lg:text-5xl">CardNest</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setView(view === "landing" ? "finder" : "landing")} className="lift soft-focus rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{view === "landing" ? "Find My Best Card" : "Back to Landing"}</button>
              <button onClick={toggleTheme} className="lift soft-focus rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>{theme === "light" ? "Dark" : "Light"}</button>
            </div>
          </div>
        </header>

        {view === "landing" ? (
          <section className="space-y-8">
            <section ref={(el) => { revealRefs.current[0] = el; }} className="reveal panel rounded-[34px] p-10 lg:p-14">
              <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                <div>
                  <p className="mb-3 inline-block rounded-full bg-cyan-500/10 px-4 py-1 text-sm font-medium text-cyan-600">For serious reward maximizers</p>
                  <h2 className="display-title text-5xl font-semibold lg:text-6xl">Find the right card with design-grade clarity.</h2>
                  <p className="mt-6 max-w-2xl text-xl opacity-80">Every recommendation is scored with spend behavior, fee tolerance, and approval-fit signals.</p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button onClick={() => setView("finder")} className="lift soft-focus rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl">Start My Card Match</button>
                    <button className="lift soft-focus rounded-2xl border px-8 py-4 text-base" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>Explore Method</button>
                  </div>
                </div>
                <div className="stagger space-y-4">
                  <HeroMetric title="Cards evaluated" value="50+" />
                  <HeroMetric title="Average completion" value="2 min" />
                  <HeroMetric title="Signals captured" value="12+" />
                  <HeroMetric title="Output" value="Ranked + explainable" />
                </div>
              </div>
            </section>
            <section className="reveal relative grid gap-5 lg:grid-cols-3" ref={(el) => { revealRefs.current[1] = el; }}>
              <div className="pointer-events-none absolute -top-3 left-0 h-1 w-48 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 opacity-70" />
              <FeatureCard
                icon={<BehaviorIcon />}
                title="Behavior-First Matching"
                text="CardNest prioritizes your real spending patterns over generic reward claims."
              />
              <FeatureCard
                icon={<EligibilityIcon />}
                title="Approval-Aware Ranking"
                text="Income and score filters ensure recommendations are actually realistic."
              />
              <FeatureCard
                icon={<ValueIcon />}
                title="Transparent Value"
                text="Every recommendation shows annual value, fee impact, and confidence."
              />
            </section>
            <section className="reveal panel relative overflow-hidden rounded-[30px] p-8 lg:p-10" ref={(el) => { revealRefs.current[2] = el; }}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-2xl" />
              <div className="mb-6 flex items-end justify-between">
                <h3 className="text-3xl font-semibold">How It Works</h3>
                <p className="text-sm opacity-70">A guided 4-stage journey</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ProcessStep
                  step="01"
                  icon={<ProfileIcon />}
                  title="Profile Intake"
                  text="Income + credit score establish your eligibility envelope."
                />
                <ProcessStep
                  step="02"
                  icon={<SpendIcon />}
                  title="Spend Mapping"
                  text="Category-wise monthly spending builds your reward fingerprint."
                />
                <ProcessStep
                  step="03"
                  icon={<TuneIcon />}
                  title="Preference Tuning"
                  text="Fee comfort and travel habits personalize scoring weight."
                />
                <ProcessStep
                  step="04"
                  icon={<RankIcon />}
                  title="Smart Output"
                  text="You get ranked cards with annual value and fee tradeoff."
                />
              </div>
            </section>
            <section className="reveal panel relative overflow-hidden rounded-[30px] p-8 lg:p-10" ref={(el) => { revealRefs.current[3] = el; }}>
              <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-violet-500/10 blur-2xl" />
              <div className="mb-5 flex items-end justify-between">
                <h3 className="text-3xl font-semibold">What You’ll See</h3>
                <p className="text-sm opacity-70">Comparison-first recommendations</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {cards.slice(0, 3).map((card, i) => (
                  <article key={card.id} className="lift rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
                    <div className={`mb-4 h-20 rounded-xl bg-gradient-to-r ${card.accent}`} />
                    <p className="text-xs uppercase tracking-wider opacity-60">Sample #{i + 1}</p>
                    <h4 className="text-lg font-semibold">{card.name}</h4>
                    <p className="text-sm opacity-70">{card.issuer}</p>
                    <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
                      <p className="text-xs opacity-70">Projected annual value</p>
                      <p className="mt-1 text-base font-semibold">INR {formatINR(48000 - i * 6500)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : (
          <section key={step} className="step-enter panel rounded-[26px] p-6 lg:p-7">
            <div className="mb-6 h-2.5 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border p-5 lg:p-6" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
                {step === 0 && <StepIncome income={income} setIncome={setIncome} />}
                {step === 1 && <StepScore score={score} setScore={setScore} />}
                {step === 2 && <StepGoal goal={goal} setGoal={setGoal} />}
                {step >= 3 && step < 3 + spendQuestions.length && <StepSpend q={spendQuestions[spendIndex]} value={spending[spendQuestions[spendIndex].key]} onChange={(v)=>setSpending((p)=>({ ...p, [spendQuestions[spendIndex].key]: v }))} index={spendIndex} total={spendQuestions.length} />}
                {step === totalSteps - 2 && <StepPreference fee={fee} setFee={setFee} travelFrequency={travelFrequency} setTravelFrequency={setTravelFrequency} loungeImportance={loungeImportance} setLoungeImportance={setLoungeImportance} />}
                {step === totalSteps - 1 && <StepResults ranked={ranked} totalMonthlySpend={totalMonthlySpend} />}

                <div className="mt-7 flex items-center justify-between">
                  <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="lift soft-focus rounded-xl border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>Back</button>
                  <button onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))} className="lift soft-focus rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{step === totalSteps - 1 ? "Recalculate" : "Continue"}</button>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
                  <p className="text-xs uppercase tracking-wider opacity-70">Live Snapshot</p>
                  <div className="mt-3 grid gap-2 text-sm">
                    <Metric label="Income" value={`INR ${formatINR(income)}`} />
                    <Metric label="Score" value={score.replace("_", " ")} />
                    <Metric label="Goal" value={goal} />
                    <Metric label="Monthly Spend" value={`INR ${formatINR(totalMonthlySpend)}`} />
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StepIncome({ income, setIncome }: { income: number; setIncome: (v: number) => void }) {
  return (
    <Question title="Set your monthly income" subtitle="Defines eligibility tier and premium card access.">
      <NumberInput value={income} onChange={setIncome} placeholder="e.g. 60000" />
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/50"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${Math.min(100, (income / 150000) * 100)}%` }} /></div>
    </Question>
  );
}

function StepScore({ score, setScore }: { score: CreditScore; setScore: (v: CreditScore) => void }) {
  return (
    <Question title="Pick your credit score band" subtitle="Approval confidence improves ranking quality.">
      <div className="grid gap-3 sm:grid-cols-2">{[["unknown", "I don't know"],["below_650", "Below 650"],["650_749", "650 - 749"],["750_plus", "750+"]].map(([v,l]) => <Choice key={v} active={score===v} onClick={() => setScore(v as CreditScore)}>{l}</Choice>)}</div>
    </Question>
  );
}

function StepGoal({ goal, setGoal }: { goal: Goal; setGoal: (v: Goal) => void }) {
  return (
    <Question title="Choose your objective" subtitle="We shift ranking weights around this preference.">
      <div className="grid gap-3 sm:grid-cols-3">{[["cashback", "Max cashback"],["rewards", "Reward points"],["travel", "Travel perks"]].map(([v,l]) => <button key={v} onClick={() => setGoal(v as Goal)} className={`rounded-2xl border p-4 text-left transition ${goal===v?"border-cyan-500 bg-cyan-500/10":"hover:-translate-y-0.5"}`} style={{ borderColor: "var(--border)", background: goal===v?undefined:"var(--surface-soft)" }}><p className="text-sm font-semibold">{l}</p><p className="mt-1 text-xs opacity-70">Personalized scoring profile</p></button>)}</div>
    </Question>
  );
}

function StepSpend({ q, value, onChange, index, total }: { q: { label: string; hint: string; accent: string }; value: number; onChange: (v: number) => void; index: number; total: number }) {
  return (
    <Question title={`How much for ${q.label.toLowerCase()}?`} subtitle={q.hint}>
      <div className={`mb-4 rounded-xl bg-gradient-to-r ${q.accent} p-3 text-sm font-semibold text-white`}>Category {index + 1}/{total}</div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <NumberInput value={value} onChange={onChange} placeholder="0" />
        <div className="rounded-xl border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>INR / month</div>
      </div>
    </Question>
  );
}

function StepPreference({ fee, setFee, travelFrequency, setTravelFrequency, loungeImportance, setLoungeImportance }: { fee: FeePreference; setFee: (v: FeePreference) => void; travelFrequency: TravelFrequency; setTravelFrequency: (v: TravelFrequency) => void; loungeImportance: number; setLoungeImportance: (v: number) => void }) {
  return (
    <Question title="Tune preferences" subtitle="Fine-tunes fee vs rewards tradeoff.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectFancy label="Annual fee comfort" value={fee} onChange={(v)=>setFee(v as FeePreference)} options={["free","low","premium"]}/>
        <SelectFancy label="Travel frequency" value={travelFrequency} onChange={(v)=>setTravelFrequency(v as TravelFrequency)} options={["rare","occasional","frequent"]}/>
      </div>
      <label className="mt-4 block text-sm">Lounge importance ({loungeImportance}/5)<input type="range" min={1} max={5} value={loungeImportance} onChange={(e)=>setLoungeImportance(Number(e.target.value))} className="mt-2 w-full accent-blue-500"/></label>
    </Question>
  );
}

function StepResults({ ranked, totalMonthlySpend }: { ranked: { card: Card; totalScore: number; annualRewards: number; annualBenefit: number; feePaid: number }[]; totalMonthlySpend: number }) {
  return (
    <Question title="Your ranked recommendations" subtitle={`Based on INR ${formatINR(totalMonthlySpend)} monthly spending`}>
      <div className="space-y-4">{ranked.map((r,i)=><article key={r.card.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wider opacity-70">#{i+1} ranked</p><h3 className="text-xl font-semibold">{r.card.name}</h3><p className="text-sm opacity-80">{r.card.issuer}</p></div><div className={`rounded-xl bg-gradient-to-r ${r.card.accent} px-4 py-2 text-white shadow-lg`}><p className="text-[11px] uppercase tracking-wide">Match score</p><p className="text-xl font-semibold">{r.totalScore}%</p></div></div><div className="grid gap-2 sm:grid-cols-3"><Metric label="Net annual value" value={`INR ${formatINR(r.annualBenefit)}`} /><Metric label="Rewards" value={`INR ${formatINR(r.annualRewards)}`} /><Metric label="Effective annual fee" value={`INR ${formatINR(r.feePaid)}`} /></div></article>)}</div>
    </Question>
  );
}

function BadgeIcon() {
  return <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white">◈</div>;
}

function HeroMetric({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}><p className="text-xs uppercase tracking-wider opacity-70">{title}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="lift panel rounded-2xl p-6">
      <div className="mb-3 inline-flex rounded-xl border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>{icon}</div>
      <h4 className="text-xl font-semibold">{title}</h4>
      <p className="mt-2 text-sm opacity-80">{text}</p>
    </article>
  );
}

function ProcessStep({ step, icon, title, text }: { step: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="lift rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-flex rounded-lg border p-2" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>{icon}</div>
        <p className="text-xs uppercase tracking-wider opacity-60">Step {step}</p>
      </div>
      <h4 className="mt-1 text-lg font-semibold">{title}</h4>
      <p className="mt-1 text-sm opacity-80">{text}</p>
    </article>
  );
}

function BehaviorIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 18L10 12L14 16L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="4" cy="18" r="2" fill="currentColor"/><circle cx="10" cy="12" r="2" fill="currentColor"/><circle cx="14" cy="16" r="2" fill="currentColor"/><circle cx="20" cy="8" r="2" fill="currentColor"/></svg>;
}
function EligibilityIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3L20 7V12C20 17 16.5 20.5 12 22C7.5 20.5 4 17 4 12V7L12 3Z" stroke="currentColor" strokeWidth="2"/><path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ValueIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M16 7H21V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}
function ProfileIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20C5.5 16.5 8.5 15 12 15C15.5 15 18.5 16.5 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}
function SpendIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 10H21" stroke="currentColor" strokeWidth="2"/></svg>;
}
function TuneIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="7" cy="18" r="2" fill="currentColor"/></svg>;
}
function RankIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 16V10M12 16V6M17 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}

function Question({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div><h2 className="text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm opacity-75">{subtitle}</p><div className="mt-5">{children}</div></div>;
}

function NumberInput({ value, onChange, placeholder }: { value: number; onChange: (v: number) => void; placeholder: string }) {
  return <input type="number" value={value} placeholder={placeholder} onChange={(e) => onChange(Number(e.target.value) || 0)} className="soft-focus w-full rounded-xl border px-4 py-3 text-xl font-semibold transition" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }} />;
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`lift soft-focus rounded-xl border px-3 py-3 text-sm font-medium transition ${active ? "border-cyan-500 bg-cyan-500/10" : ""}`} style={{ borderColor: "var(--border)", background: active ? undefined : "var(--surface-soft)" }}>{children}</button>;
}

function SelectFancy({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <label className="text-sm">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="soft-focus mt-2 w-full rounded-xl border px-3 py-3 transition" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}><p className="text-xs opacity-70">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
