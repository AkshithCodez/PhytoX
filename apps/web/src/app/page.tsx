import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  ChartNoAxesCombined,
  Check,
  Globe2,
  MapPin,
  ScanLine,
  ShieldCheck,
  Sprout,
  Users,
  Leaf,
} from "lucide-react";
import { Brand } from "@/components/ui";
import { Botanical } from "@/components/botanical";
export default function Home() {
  return (
    <div className="marketing">
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </nav>
        <div className="header-actions">
          <Link className="officer-link" href="/auth/login?portal=officer">
            Officer login
            <ArrowRight size={15} />
          </Link>
          <Link className="button small" href="/farmer">
            Farmer portal
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-dot" />
              CROP HEALTH, CONNECTED.
            </p>
            <h1>
              A closer look.
              <br />A healthier <span className="serif">harvest.</span>
            </h1>
            <p className="hero-description">
              Understand your crop’s health with AI-assisted insights. Turn a
              single observation into a clearer picture of your region.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/farmer">
                Identify crop disease
                <ArrowRight size={18} />
              </Link>
              <a className="button secondary" href="#platform">
                Explore the platform
                <ArrowDown size={17} />
              </a>
            </div>
            <div className="hero-footnote">
              <ShieldCheck size={18} />
              <span>AI-assisted. Expert-reviewed. Farmer-first.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-grid" />
            <div className="visual-label">
              <span className="live-dot" />A NEW PERSPECTIVE ON PLANT HEALTH
            </div>
            <Botanical />
            <div className="scan-corners">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="plant-label">
              <span>01 / OBSERVE</span>
              <strong>
                Small signs.
                <br />
                Meaningful insights.
              </strong>
            </div>
            <div className="visual-note">
              <Leaf size={22} />
              <div>
                <strong>From leaf to landscape</strong>
                <span>Illustration of the PhytoX workflow</span>
              </div>
              <ArrowRight size={18} />
            </div>
          </div>
          <div className="hero-index">
            01 — INTELLIGENCE THAT STARTS IN YOUR FIELD
          </div>
        </section>
        <section className="principles-strip">
          <span>
            <Camera />
            One photograph to get started
          </span>
          <span>
            <Globe2 />
            English · తెలుగు · हिन्दी
          </span>
          <span>
            <ShieldCheck />
            Your observations stay yours
          </span>
        </section>
        <section className="section platform-section" id="platform">
          <div className="section-heading">
            <p className="eyebrow">THE BIGGER PICTURE</p>
            <h2>
              Better decisions,
              <br />
              <span className="serif">from the ground up.</span>
            </h2>
            <p>
              Crop health doesn’t stop at the edge of a field. PhytoX connects
              everyday observations with the people who can help make sense of
              them.
            </p>
          </div>
          <div className="platform-cards">
            <article className="feature-card farmer-card">
              <span className="card-kicker">
                <Sprout size={20} />
                FOR FARMERS
              </span>
              <h3>
                A little clarity.
                <br />
                Right in your hands.
              </h3>
              <p>
                Capture a leaf, understand the model’s assessment, and keep a
                record of what you see. Share an observation when you’re ready.
              </p>
              <ul>
                <li>
                  <Check />
                  Photo-based crop assessment
                </li>
                <li>
                  <Check />
                  Private diagnosis history
                </li>
                <li>
                  <Check />
                  Verified regional information
                </li>
              </ul>
              <Link href="/farmer" className="text-link">
                Enter farmer workspace
                <ArrowRight size={18} />
              </Link>
            </article>
            <article className="feature-card officer-card">
              <span className="card-kicker">
                <ChartNoAxesCombined size={20} />
                FOR AGRICULTURAL OFFICERS
              </span>
              <h3>
                Local observations.
                <br />
                Regional understanding.
              </h3>
              <p>
                Review submitted reports, explore geographic patterns, and
                investigate signals with the evidence in view.
              </p>
              <div className="mini-region">
                <MapPin size={24} />
                <div>
                  <strong>Evidence before action</strong>
                  <span>Reports → review → regional insight</span>
                </div>
              </div>
              <Link href="/auth/login?portal=officer" className="text-link">
                Enter officer workspace
                <ArrowRight size={18} />
              </Link>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="section workflow-section">
          <div className="section-heading horizontal">
            <div>
              <p className="eyebrow">A SIMPLE PATH TO CLARITY</p>
              <h2>
                Observe. Understand.
                <br />
                <span className="serif">Take the next step.</span>
              </h2>
            </div>
            <p>
              One connected workflow, from your first photograph to informed
              regional monitoring.
            </p>
          </div>
          <div className="steps">
            {[
              [
                Camera,
                "01",
                "Capture a leaf",
                "Upload a clear photograph or use your phone’s camera.",
              ],
              [
                ScanLine,
                "02",
                "Read the assessment",
                "Review a model prediction, alternatives, and uncertainty.",
              ],
              [
                Users,
                "03",
                "Share for review",
                "Save privately or submit an observation to a regional officer.",
              ],
              [
                MapPin,
                "04",
                "See the bigger picture",
                "Authorized reports inform monitoring. Experts verify findings.",
              ],
            ].map(([Icon, n, title, copy]) => {
              const I = Icon as typeof Camera;
              return (
                <article key={String(n)}>
                  <div className="step-top">
                    <I size={25} />
                    <span>{String(n)}</span>
                  </div>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section id="features" className="section trust-section">
          <div className="trust-art">
            <Botanical small />
            <div className="trust-stamp">
              <ShieldCheck size={28} />
              <span>
                Designed for
                <br />
                <strong>responsible intelligence.</strong>
              </span>
            </div>
          </div>
          <div>
            <p className="eyebrow">USEFUL INSIGHTS. HONEST LIMITS.</p>
            <h2>
              Confidence starts
              <br />
              with <span className="serif">transparency.</span>
            </h2>
            <p>
              An image can offer clues. It cannot tell the whole story. PhytoX
              makes that distinction part of every assessment.
            </p>
            <div className="trust-points">
              <div>
                <ShieldCheck />
                <span>
                  <strong>A suggestion, never a certainty</strong>Model
                  confidence is not proven accuracy. Uncertain results call for
                  expert review.
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  <strong>Privacy at the field level</strong>Location sharing is
                  optional. Farmer insights use privacy-preserving regional
                  summaries.
                </span>
              </div>
              <div>
                <Users />
                <span>
                  <strong>People make the final call</strong>A cluster of
                  reports is a signal to investigate, not an automatically
                  confirmed outbreak.
                </span>
              </div>
            </div>
            <Link className="text-link" href="/privacy">
              Our approach to privacy and AI
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
        <section className="final-cta">
          <div>
            <p className="eyebrow">EVERY HEALTHIER HARVEST STARTS SOMEWHERE.</p>
            <h2>Start with what you see.</h2>
          </div>
          <Link className="button lime" href="/farmer">
            Take a closer look
            <ArrowRight size={19} />
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <p>
          Detect locally. Understand regionally.
          <br />
          Respond intelligently.
        </p>
        <nav aria-label="Footer">
          <Link href="/farmer">Farmer portal</Link>
          <Link href="/auth/login?portal=officer">Officer login</Link>
          <Link href="/language">Languages</Link>
          <Link href="/privacy">Privacy & responsible AI</Link>
        </nav>
        <span className="footer-small">PhytoX · Agricultural intelligence</span>
      </footer>
    </div>
  );
}
