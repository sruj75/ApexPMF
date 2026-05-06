import Link from "next/link";

type AuthEntryProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthEntry({ eyebrow, title, description }: AuthEntryProps) {
  return (
    <main className="auth-shell">
      <Link className="brand-link" href="/">
        The Mom Test Simulator
      </Link>
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-description">{description}</p>
        <a className="primary-action" href="/auth/start?next=/dashboard">
          Continue with Google
        </a>
      </section>
    </main>
  );
}
