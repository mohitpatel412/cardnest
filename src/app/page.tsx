"use client";

import Link from "next/link";
import { useState } from "react";

function Logo({ textColor, size = "default", style }: { textColor?: string; size?: "default" | "small"; style?: React.CSSProperties }) {
  const markStyle =
    size === "small" ? { width: "32px", height: "32px", borderRadius: "8px", fontSize: "15px" } : undefined;
  const textStyle = textColor ? { color: textColor } : undefined;

  return (
    <div className="logo" style={style}>
      <div className="logo-mark" style={markStyle}>
        ?
      </div>
      <div className="logo-text" style={textStyle}>
        Card<span>Nest</span>
      </div>
    </div>
  );
}

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={isMenuOpen ? "menu-open" : ""}>
      <div className="container nav-inner">
        <Link href="/" onClick={() => setIsMenuOpen(false)}>
          <Logo />
        </Link>

        <ul className="nav-links desktop-only">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#features">Why CardNest</a></li>
          <li><a href="#cards">Top Cards</a></li>
        </ul>

        <div className="nav-cta">
          <Link href="/app" className="btn-primary desktop-only">Find My Card ?</Link>
          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen((p) => !p)} aria-label="Toggle Menu">
            {isMenuOpen ? "?" : "?"}
          </button>
        </div>
      </div>

      <ul className={`nav-links mobile-menu ${isMenuOpen ? "mobile-open" : ""}`}>
        <li><a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it works</a></li>
        <li><a href="#features" onClick={() => setIsMenuOpen(false)}>Why CardNest</a></li>
        <li><a href="#cards" onClick={() => setIsMenuOpen(false)}>Top Cards</a></li>
        <li>
          <Link href="/app" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setIsMenuOpen(false)}>
            Find My Card ?
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="hero-badge"><span className="dot"></span>Built for Indian card choices</div>
            <h1 className="hero-h1">Find your <span className="accent">best-fit</span> card in minutes</h1>
            <p className="hero-sub">CardNest maps your spending, fee comfort, and approval profile to rank cards that can actually work for you.</p>
            <div className="hero-actions">
              <Link href="/app" className="btn-primary large">Find My Best Card</Link>
              <a href="#how-it-works" className="btn-ghost">How matching works</a>
            </div>
            <div className="hero-proof-strip">
              <div className="hero-proof-card">
                <div className="hero-proof-value">50+</div>
                <div className="hero-proof-label">Cards tracked</div>
              </div>
              <div className="hero-proof-card">
                <div className="hero-proof-value">~2 min</div>
                <div className="hero-proof-label">Recommendation time</div>
              </div>
              <div className="hero-proof-card">
                <div className="hero-proof-value">No signup</div>
                <div className="hero-proof-label">Start instantly</div>
              </div>
            </div>
            <div className="hero-trust">
              <div className="trust-item"><span className="icon">Secure</span> No data stored</div>
              <div className="trust-item"><span className="icon">Fast</span> 2 minutes</div>
              <div className="trust-item"><span className="icon">Cards</span> 50+ cards analyzed</div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-ani-wrap">
              <div className="float-badge left">
                <div className="fb-icon">??</div>
                <div><div className="fb-text">?49,000 saved</div><div className="fb-sub">Annual estimated benefit</div></div>
              </div>
              <div className="float-badge right">
                <div className="fb-icon">?</div>
                <div><div className="fb-text">HIGH Approval</div><div className="fb-sub">Based on your profile</div></div>
              </div>

              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="phone-inner">
                    <div className="phone-header">Your Top 5 Matches</div>
                    <div className="phone-title">Personalized for you ?</div>

                    <div className="phone-card">
                      <div className="phone-card-top">
                        <div><div className="phone-bank">HDFC Bank</div><div className="phone-card-name">Millennia Credit Card</div></div>
                        <div className="match-ring"><div className="match-num">71</div></div>
                      </div>
                      <div className="phone-metrics">
                        <div className="phone-metric"><div className="phone-metric-val green">?12K</div><div className="phone-metric-lbl">Annual Benefit</div></div>
                        <div className="phone-metric"><div className="phone-metric-val">?1K</div><div className="phone-metric-lbl">Annual Fee</div></div>
                        <div className="phone-metric"><div className="phone-metric-val green">?11K</div><div className="phone-metric-lbl">Net Savings</div></div>
                      </div>
                      <div className="phone-tags">
                        <span className="phone-tag green">HIGH Approval</span><span className="phone-tag">5% Amazon CB</span><span className="phone-tag">Swiggy 5%</span>
                      </div>
                      <button className="phone-apply">Apply Now ?</button>
                    </div>

                    <div className="phone-card" style={{ opacity: 0.5, transform: "scale(0.97)" }}>
                      <div className="phone-card-top">
                        <div><div className="phone-bank">SBI Card</div><div className="phone-card-name">SimplyCLICK</div></div>
                        <div className="match-ring" style={{ background: "conic-gradient(#10B981 65%, #E2E8F4 65%)" }}><div className="match-num" style={{ color: "#10B981" }}>65</div></div>
                      </div>
                      <div className="phone-tags"><span className="phone-tag green">LIFETIME FREE</span><span className="phone-tag">10X Amazon Points</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return <div className="trust-bar"><div className="container"><div className="trust-bar-inner"><div className="trust-bar-label">Cards from</div><div className="trust-bank">HDFC</div><div className="trust-bank">SBI Card</div><div className="trust-bank">ICICI</div><div className="trust-bank">Axis</div><div className="trust-bank">Kotak</div><div className="trust-bank">Yes Bank</div><div className="trust-bank">IDFC First</div><div className="trust-bank">IndusInd</div><div className="trust-bank">Amex</div></div></div></div>;
}

function Stats() {
  return <section className="stats-section"><div className="container"><div className="stats-grid"><div className="stat-item"><div className="stat-num">50<span>+</span></div><div className="stat-label">Credit cards in database</div></div><div className="stat-item"><div className="stat-num">?<span>49K</span></div><div className="stat-label">Avg. annual savings found</div></div><div className="stat-item"><div className="stat-num">2<span>min</span></div><div className="stat-label">To get your top matches</div></div><div className="stat-item"><div className="stat-num">0<span>?</span></div><div className="stat-label">Cost to use. Always free.</div></div></div></div></section>;
}

function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-label">Simple Process</div>
        <h2 className="section-h2">From zero to your perfect card<br />in under 2 minutes</h2>
        <p className="section-sub">No lengthy forms. No sign up. Just smart questions that help our algorithm find exactly the right card for how you live.</p>
        <div className="how-grid">
          <div className="how-card"><div className="how-num">01</div><div className="how-icon">??</div><div className="how-title">Tell us about you</div><p className="how-desc">Your occupation, monthly income, credit score range, and how many cards you already hold. Takes 30 seconds.</p></div>
          <div className="how-card"><div className="how-num">02</div><div className="how-icon">??</div><div className="how-title">Share your spending</div><p className="how-desc">Select spend ranges for groceries, dining, travel, fuel, bills, and more. No exact numbers needed — just rough estimates work great.</p></div>
          <div className="how-card"><div className="how-num">03</div><div className="how-icon">??</div><div className="how-title">Set your preferences</div><p className="how-desc">Pick your primary goal — cashback, rewards, travel perks. Tell us where you shop and what fee you're comfortable with.</p></div>
        </div>
        <div style={{ textAlign: "center", marginTop: "48px" }}><Link href="/app" className="btn-primary large">Start Now — It&apos;s Free ?</Link><p style={{ marginTop: "14px", fontSize: "13px", color: "var(--text-3)" }}>No account needed · Results in under 2 minutes · Data never saved</p></div>
      </div>
    </section>
  );
}

function Features() {
  const [activeFeature, setActiveFeature] = useState(0);
  const features = [
    { icon: "??", title: "Savings calculated for YOUR spend", desc: "We compute actual rupee benefits based on your exact spending pattern — not generic averages." },
    { icon: "?", title: "Approval chances shown upfront", desc: "Based on your income, credit score, and bank relationship — we tell you if you're likely to get approved before you apply." },
    { icon: "????", title: "India-first platform selection", desc: "Amazon, Flipkart, Swiggy, Zomato, IRCTC, Nykaa — we know where Indians actually shop and optimize for that." },
    { icon: "??", title: "Zero data storage, ever", desc: "Your financial info stays on your device. We never store, sell, or share any data. CardNest runs entirely client-side." },
  ];

  return (
    <section className="features-section" id="features">
      <div className="container"><div className="section-label" style={{ color: "rgba(255,255,255,0.4)" }}>Why CardNest</div><h2 className="section-h2" style={{ color: "white" }}>Not another comparison<br />website. Something better.</h2><div className="features-grid"><div className="feature-list">{features.map((pkg, idx) => (<div key={idx} className={`feature-item ${activeFeature === idx ? "active" : ""}`} onClick={() => setActiveFeature(idx)}><div className="feature-icon-wrap">{pkg.icon}</div><div><div className="feature-title">{pkg.title}</div><div className="feature-desc">{pkg.desc}</div></div></div>))}</div><div className="feature-preview"><div className="preview-window-header"><div className="dot-r"></div><div className="dot-y"></div><div className="dot-g"></div></div><div className="preview-content-title">Why HDFC Millennia is #1 for you</div><div className="preview-card-demo"><div className="preview-card-row"><div><div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>HDFC BANK</div><div className="preview-card-name">Millennia Credit Card</div></div><div className="preview-score-badge">71/100</div></div><div className="preview-why-list"><div className="preview-why-item"><div className="check-icon">?</div>5% cashback on Amazon & Flipkart (your top platforms)</div><div className="preview-why-item"><div className="check-icon">?</div>Pre-approved — you hold an HDFC salary account</div><div className="preview-why-item"><div className="check-icon">?</div>Fee waived at ?1L annual spend — you easily qualify</div><div className="preview-why-item"><div className="check-icon">?</div>1% back on ?20,000 "Everything Else" monthly spend</div></div><div className="preview-savings-row"><div style={{ fontSize: "12px", fontWeight: 600, color: "#10B981" }}>Your estimated annual savings</div><div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "'Clash Display', sans-serif", color: "#10B981" }}>?11,000</div></div></div></div></div></div>
    </section>
  );
}

function CardsPreview() { return <section className="cards-preview" id="cards"><div className="container"><div className="section-label">Top Cards</div><h2 className="section-h2">50+ cards. One perfect match.</h2><p className="section-sub">From lifetime-free entry cards to premium travel cards — we cover the entire Indian market.</p></div><div className="cards-scroll" style={{ paddingLeft: "calc((100% - 1160px)/2 + 40px)" }}><div className="card-preview-item"><div className="card-preview-visual" style={{ background: "linear-gradient(135deg,#1a237e,#3F51B5)" }}>??</div><div className="card-preview-bank">HDFC Bank</div><div className="card-preview-name">Millennia Credit Card</div><div className="card-preview-stats"><div className="cps-item"><div className="cps-val green">?12K</div><div className="cps-label">Annual Benefit</div></div><div className="cps-item"><div className="cps-val">?1,000</div><div className="cps-label">Annual Fee</div></div></div></div><div className="card-preview-item"><div className="card-preview-visual" style={{ background: "linear-gradient(135deg,#1B4332,#2D6A4F)" }}>??</div><div className="card-preview-bank">SBI Card</div><div className="card-preview-name">SimplyCLICK</div><div className="card-preview-stats"><div className="cps-item"><div className="cps-val green">?7.2K</div><div className="cps-label">Annual Benefit</div></div><div className="cps-item"><div className="cps-val">FREE</div><div className="cps-label">Annual Fee</div></div></div></div><div className="card-preview-item"><div className="card-preview-visual" style={{ background: "linear-gradient(135deg,#7B1818,#C62828)" }}>??</div><div className="card-preview-bank">Axis Bank</div><div className="card-preview-name">ACE Credit Card</div><div className="card-preview-stats"><div className="cps-item"><div className="cps-val green">?9K</div><div className="cps-label">Annual Benefit</div></div><div className="cps-item"><div className="cps-val">FREE</div><div className="cps-label">Annual Fee</div></div></div></div><div className="card-preview-item"><div className="card-preview-visual" style={{ background: "linear-gradient(135deg,#4A148C,#7B1FA2)" }}>??</div><div className="card-preview-bank">ICICI Bank</div><div className="card-preview-name">Amazon Pay ICICI</div><div className="card-preview-stats"><div className="cps-item"><div className="cps-val green">?8.4K</div><div className="cps-label">Annual Benefit</div></div><div className="cps-item"><div className="cps-val">FREE</div><div className="cps-label">Annual Fee</div></div></div></div><div className="card-preview-item"><div className="card-preview-visual" style={{ background: "linear-gradient(135deg,#0D47A1,#1565C0)" }}>??</div><div className="card-preview-bank">Kotak</div><div className="card-preview-name">811 Dream Different</div><div className="card-preview-stats"><div className="cps-item"><div className="cps-val green">?5K</div><div className="cps-label">Annual Benefit</div></div><div className="cps-item"><div className="cps-val">FREE</div><div className="cps-label">Annual Fee</div></div></div></div><div className="card-preview-item"><div className="card-preview-visual" style={{ background: "linear-gradient(135deg,#1A237E,#283593)" }}>??</div><div className="card-preview-bank">Yes Bank</div><div className="card-preview-name">Prosperity Rewards Plus</div><div className="card-preview-stats"><div className="cps-item"><div className="cps-val green">?12K</div><div className="cps-label">Annual Benefit</div></div><div className="cps-item"><div className="cps-val">?2,499</div><div className="cps-label">Annual Fee</div></div></div></div></div></section>; }

function CTASection() { return <section className="cta-section"><div className="container"><h2 className="cta-h2">Ready to find your<br /><span className="accent">perfect card?</span></h2><p className="cta-sub">Join thousands of Indians who found their ideal credit card with CardNest.</p><div className="cta-actions"><Link href="/app" className="btn-primary large" style={{ background: "white", color: "var(--navy)" }}>? Get My Recommendations</Link></div><div className="cta-trust"><div className="cta-trust-item">?? No data stored</div><div className="cta-trust-item">?? No email required</div><div className="cta-trust-item">? Results in 2 minutes</div><div className="cta-trust-item">?0 Completely free</div></div></div></section>; }

function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <div>
          <Logo textColor="white" style={{ marginBottom: "10px" }} />
          <div className="footer-note">CardNest is an independent recommendation tool. We are not affiliated with any bank. Card details may change — always verify on the bank's official website before applying.</div>
        </div>
        <div className="footer-links"><Link href="/">Privacy Policy</Link><Link href="/">Disclaimer</Link><Link href="/">Contact</Link></div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div id="landing">
      <Navbar />
      <Hero />
      <TrustBar />
      <Stats />
      <HowItWorks />
      <Features />
      <CardsPreview />
      <CTASection />
      <Footer />
    </div>
  );
}


