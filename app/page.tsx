import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-shell">
      <aside className="landing-sidebar" aria-label="Product">
        <Link className="brand-link" href="/">
          The Mom Test Simulator
        </Link>
        <nav className="site-nav" aria-label="Landing navigation">
          <a href="#features">Features</a>
          <a href="#reports">Reports</a>
          <a href="#pricing">Pricing</a>
          <Link className="login-link" href="/login">
            Log in
          </Link>
        </nav>
        <p className="sidebar-note">
          Independent customer discovery practice. Not affiliated with The Mom
          Test.
        </p>
      </aside>

      <main className="landing-main">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Voice-first customer discovery practice</p>
            <h1 id="hero-title">The Mom Test Simulator</h1>
            <p className="hero-promise">
              Sharpen your skill to talk to your customers.
            </p>
            <p className="hero-detail">
              Practice real interview pressure with fresh Customer Personas,
              hidden Traps, and post-session feedback that rewards Learning
              Signal instead of pitch validation.
            </p>
            <div className="hero-actions" aria-label="Landing page actions">
              <Link className="primary-action" href="/signup">
                Get Started for free
              </Link>
              <a className="secondary-action" href="#features">
                Learn more
              </a>
            </div>
          </div>

          <div className="session-console" aria-label="Session preview">
            <div className="console-bar">
              <span>Live Session</span>
              <span>00:07:42</span>
            </div>
            <div className="conversation-strip">
              <p>
                <span>Learner</span>
                When did you last try to solve this?
              </p>
              <p>
                <span>Customer Persona</span>
                Last Tuesday. I exported a spreadsheet because our current tool
                missed the buyer approval step.
              </p>
              <p>
                <span>Hidden Evaluation</span>
                Concrete History found. Compliment Trap avoided.
              </p>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="content-section"
          aria-labelledby="features-title"
        >
          <div className="section-kicker">How practice works</div>
          <h2 id="features-title">Practice the interview, not the pitch.</h2>
          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-index">01</span>
              <h3>Start a Voice Conversation</h3>
              <p>
                Enter a spoken Session quickly, without lesson-style onboarding
                or a pre-session configuration chore.
              </p>
            </article>
            <article className="feature-card">
              <span className="feature-index">02</span>
              <h3>Meet fresh Customer Personas</h3>
              <p>
                Practice against realistic, freshly generated Customer Personas
                with Customer Fit, friction, and hidden Traps.
              </p>
            </article>
            <article className="feature-card">
              <span className="feature-index">03</span>
              <h3>Review your Session Report</h3>
              <p>
                After the Session, inspect missed signals, bad questions, strong
                questions, and Trap Results.
              </p>
            </article>
          </div>
        </section>

        <section
          id="reports"
          className="report-section"
          aria-labelledby="reports-title"
        >
          <div>
            <div className="section-kicker">Post-session feedback</div>
            <h2 id="reports-title">A report that shows what you actually learned.</h2>
          </div>
          <div className="report-grid">
            <article className="report-card">
              <span>Learning Signal</span>
              <p>
                Did you uncover Concrete History, existing workarounds, decision
                process, or non-customer fit?
              </p>
            </article>
            <article className="report-card">
              <span>Interview Behavior</span>
              <p>
                See where you pitched, led, accepted vague praise, or followed
                up with useful questions.
              </p>
            </article>
            <article className="report-card">
              <span>Expandable Evidence</span>
              <p>
                Open transcript excerpts inside the Session Report without
                digging through raw notes.
              </p>
            </article>
          </div>
        </section>

        <section
          id="pricing"
          className="content-section"
          aria-labelledby="pricing-title"
        >
          <div className="section-kicker">Placeholder pricing</div>
          <h2 id="pricing-title">Pricing that follows practice.</h2>
          <div className="pricing-grid">
            <article className="pricing-card">
              <p className="pricing-label">Free Trial Session</p>
              <p className="pricing-value">$0</p>
              <p>
                Try one voice-first Session and get a real Session Report before
                paying.
              </p>
            </article>
            <article className="pricing-card pricing-card-featured">
              <p className="pricing-label">Subscription Credits</p>
              <p className="pricing-value">$9/month</p>
              <p>
                Monthly practice capacity for founders who want repeated
                customer discovery reps.
              </p>
            </article>
            <article className="pricing-card">
              <p className="pricing-label">Top-ups</p>
              <p className="pricing-value">Pay as needed</p>
              <p>
                Add extra usage when you need more Sessions beyond the monthly
                Credits.
              </p>
            </article>
          </div>
        </section>

        <footer className="site-footer">
          <span>The Mom Test Simulator</span>
          <span>Independent customer discovery practice. Not affiliated with The Mom Test.</span>
        </footer>
      </main>
    </div>
  );
}
