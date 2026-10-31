"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="setup">
      <h1>We couldn’t load this page.</h1>
      <p>Your request did not complete. Try again or return to the website.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <a href="/">Return home</a>
    </main>
  );
}
