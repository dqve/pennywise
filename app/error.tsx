'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main><section className="auth-shell"><div className="auth-card"><span className="eyebrow">PENNYWISE</span><h1>We hit a temporary problem.</h1><p>Your financial data was not intentionally changed. Try the page again, and if the problem persists, sign out and back in.</p><button className="primary" onClick={() => reset()}>Try again</button></div></section></main>;
}
