import Link from "next/link";
import { PRODUCT_DISPLAY_NAME } from "@/src/product/brand";

type AuthEntryProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthEntry({ eyebrow, title, description }: AuthEntryProps) {
  return (
    <main className="auth-shell">
      <Link className="brand-link" href="/">
        {PRODUCT_DISPLAY_NAME}
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
