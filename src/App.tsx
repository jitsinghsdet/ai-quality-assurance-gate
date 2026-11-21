
import { useState } from "react";
import { currentTicket } from "./ticket";
import { evaluateReleaseCandidate } from "./releaseGate";
import type { SummaryResponse } from "./types";

type ViewState = "idle" | "loading" | "success" | "insufficient" | "error";

export default function App() {
  const [view, setView] = useState<ViewState>("idle");
  const [summary, setSummary] = useState("");
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [approved, setApproved] = useState(false);

  const releaseEvaluation = evaluateReleaseCandidate(
    { summary, sourceIds },
    currentTicket
  );

  const canApprove =
    view === "success" &&
    releaseEvaluation.eligible &&
    !approved;

  async function generate() {
    setView("loading");
    setMessage("");
    setSummary("");
    setSourceIds([]);
    setApproved(false);

    try {
      const response = await fetch(
        `/api/tickets/${currentTicket.id}/summary`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Generation failed (${response.status})`);
      }

      const data = await response.json() as SummaryResponse;

      if (data.status === "insufficient_information") {
        setView("insufficient");
        return;
      }

      setSummary(data.summary);
      setSourceIds(data.sourceIds);
      setView("success");

      const result = evaluateReleaseCandidate(data, currentTicket);

      if (!result.eligible) {
        setMessage(
          "Summary failed release validation and cannot be approved."
        );
      }

    } catch {
      setView("error");
      setMessage(
        "Summary generation is temporarily unavailable. Please retry."
      );
    }
  }

  return (
    <main className="shell">
      <header>
        <div className="eyebrow">SUPPORT WORKSPACE</div>
        <h1>Ticket {currentTicket.id}</h1>
        <p className="muted">AI-assisted ticket summary</p>
      </header>

      <section className="ticket card">
        <div className="ticket-heading">
          <div>
            <div className="eyebrow">OPEN TICKET</div>
            <h2>{currentTicket.subject}</h2>
          </div>
          <span className="status">Open</span>
        </div>

        {currentTicket.messages.map(item => (
          <article className="message" key={item.id}>
            <div className="message-meta">
              <strong>{item.author}</strong>
              <span>{item.id}</span>
            </div>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="card generator">
        <div className="section-heading">
          <div>
            <div className="eyebrow">ASSISTED WORKFLOW</div>
            <h2>Ticket summary</h2>
          </div>

          <button onClick={generate} disabled={view === "loading"}>
            {view === "loading"
              ? "Generating…"
              : view === "error"
                ? "Retry generation"
                : "Generate summary"}
          </button>
        </div>

        {view === "idle" && (
          <p className="muted" data-testid="summary-placeholder">
            Generate a summary from this ticket's conversation.
          </p>
        )}

        {view === "loading" && (
          <p role="status">Generating summary…</p>
        )}

        {view === "insufficient" && (
          <p className="notice" role="status">
            Insufficient information to generate a reliable summary.
          </p>
        )}

        {view === "error" && (
          <p className="error" role="alert">{message}</p>
        )}

        {view === "success" && (
          <div data-testid="summary-result">
            <p>{summary}</p>

            <div className="citations">
              Sources: {sourceIds.length ? sourceIds.join(", ") : "None"}
            </div>

            {message && (
              <p className="error" role="alert">{message}</p>
            )}
          </div>
        )}

        <div className="actions">
          <button
            className="approve"
            disabled={!canApprove}
            onClick={() => setApproved(true)}
          >
            Approve summary
          </button>

          {approved && (
            <span className="approved" role="status">Approved</span>
          )}

          {view === "success" && releaseEvaluation.reasons.length > 0 && (
            <div className="muted" data-testid="approval-blocked">
              Approval blocked: {releaseEvaluation.reasons.join(" ")}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}