import { useState, useCallback, type FormEvent } from "react";

const SUGGESTIONS = [
    "Which 5 farmers have the highest pending payments?",
    "What is the total pending payment owed by the factory?",
    "Show me the farmers with the lowest supplied cane.",
    "List all farmers sorted by amount paid.",
    "How many farmers have zero pending payments?",
];

const STATS = [
    { label: "Data Source", value: "MongoDB", badge: "DB" },
    { label: "AI Model",    value: "GPT-5.5", badge: "AI" },
    { label: "Protocol",    value: "MCP",     badge: "MCP" },
];

function SugarcaneIcon() {
    return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M16 27V7m0 8c-5.5 0-8-3.2-8-8 5.5 0 8 3.2 8 8Zm0 5c5.5 0 8-3.2 8-8-5.5 0-8 3.2-8 8Z"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
            />
            <path d="M12 27h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function App() {
    const [question, setQuestion] = useState("");
    const [answer,   setAnswer]   = useState("");
    const [error,    setError]    = useState("");
    const [loading,  setLoading]  = useState(false);
    const [copied,   setCopied]   = useState(false);

    const submit = useCallback(async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed || loading) return;
        setLoading(true); setAnswer(""); setError("");
        try {
            const res = await fetch("/api/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: trimmed }),
            });
            const data: { answer?: string; error?: string } = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
            setAnswer(data.answer ?? "No answer returned.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to reach the server.");
        } finally {
            setLoading(false);
        }
    }, [loading]);

    const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        submit(question);
    }, [question, submit]);

    const onChip = useCallback((text: string) => {
        setQuestion(text);
        setAnswer(""); setError("");
    }, []);

    const onCopy = useCallback(() => {
        if (!answer) return;
        navigator.clipboard.writeText(answer).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [answer]);

    return (
        <div className="app-shell">

            {/* TOPBAR */}
            <header className="topbar">
                <a className="brand" href="/" aria-label="Sugarcane AI home">
                    <span className="brand-icon"><SugarcaneIcon /></span>
                    Sugarcane<span className="brand-accent"> AI</span>
                </a>
                <div className="nav-pill">
                    <span className="status-dot" />
                    Farmer data assistant
                </div>
            </header>

            {/* MAIN */}
            <main className="main-content">

                {/* Hero */}
                <section className="hero">
                    <h1 className="hero-title">
                        Your farm data, <span className="highlight">made simple.</span>
                    </h1>
                    <p className="hero-sub">
                        Ask any question about farmer payments and get a clear answer from your records.
                    </p>
                </section>

                {/* Stats */}
                <div className="stats-row">
                    {STATS.map(s => (
                        <div className="stat-card" key={s.label}>
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value">{s.value}</span>
                            <span className="stat-badge">{s.badge}</span>
                        </div>
                    ))}
                </div>

                {/* Question card */}
                <section className="question-card">
                    <div className="card-header">
                        <div>
                            <p className="card-kicker">Ask a question</p>
                            <h2 className="card-title">What would you like to know?</h2>
                        </div>
                        <span className="sparkle-icon" aria-hidden="true">*</span>
                    </div>

                    <div className="card-body">
                        <form onSubmit={onSubmit}>
                            <label className="sr-only" htmlFor="question-input">Your question</label>
                            <textarea
                                id="question-input"
                                className="question-textarea"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                placeholder="e.g. Which farmers have the highest pending payments?"
                                maxLength={2000}
                                rows={3}
                                disabled={loading}
                            />
                            <div className="form-footer">
                                <div className="form-actions">
                                    <button
                                        id="ask-btn"
                                        className="btn-ask"
                                        type="submit"
                                        disabled={!question.trim() || loading}
                                    >
                                        {loading ? (
                                            <><span className="spinner" /> Thinking...</>
                                        ) : (
                                            <>Ask question <span className="arrow">-&gt;</span></>
                                        )}
                                    </button>
                                </div>
                                <div className="char-info">
                                    <span className="char-count">{question.length}/2000</span>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="suggestions-section">
                        <span className="suggestions-label">Try asking</span>
                        <div className="suggestion-chips">
                            {SUGGESTIONS.map(s => (
                                <button
                                    key={s} className="chip" type="button"
                                    disabled={loading} onClick={() => onChip(s)}
                                >
                                    <span className="chip-arrow">&rarr;</span>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Loading */}
                {loading && (
                    <div className="loading-card" role="status" aria-live="polite">
                        <div className="loading-ring" />
                        <div>
                            <p className="loading-label">Working on it</p>
                            <p className="loading-text">Checking your farmer records...</p>
                        </div>
                    </div>
                )}

                {/* Answer */}
                {answer && !loading && (
                    <section className="answer-card" aria-live="polite">
                        <div className="answer-header">
                            <span className="answer-avatar">AI</span>
                            <div>
                                <p className="answer-name">Sugarcane AI</p>
                                <p className="answer-tag">Answer</p>
                            </div>
                        </div>
                        <p className="answer-body">{answer}</p>
                        <div className="answer-footer">
                            <span className="answer-footnote">Based on your farmer records</span>
                            <button className="copy-btn" onClick={onCopy}>
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </section>
                )}

                {/* Error */}
                {error && (
                    <div className="error-card" role="alert">
                        <span className="error-icon">!</span>
                        <div>
                            <p className="error-label">Error</p>
                            <p className="error-msg">{error}</p>
                        </div>
                    </div>
                )}

            </main>

            {/* FOOTER */}
            <footer className="page-footer">
                <span>Sugarcane AI</span>
                <span className="footer-sep">|</span>
                <span>Powered by your farmer records</span>
            </footer>
        </div>
    );
}