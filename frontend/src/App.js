import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

/* ── Helpers ─────────────────────────────────── */
function getScoreClass(score) {
  if (score >= 70) return "score-high";
  if (score >= 40) return "score-medium";
  return "score-low";
}

function getScoreLabel(score) {
  if (score >= 80) return "Excellent Match! 🎉";
  if (score >= 60) return "Good Match 👍";
  if (score >= 40) return "Moderate Match 📊";
  if (score >= 20) return "Weak Match ⚠️";
  return "Poor Match ❌";
}

function getScoreDescription(score) {
  if (score >= 80)
    return "Your resume aligns very well with the job requirements. You're a strong candidate!";
  if (score >= 60)
    return "Good alignment with the role. Consider adding a few missing skills to stand out.";
  if (score >= 40)
    return "Moderate overlap detected. Work on acquiring the missing skills to boost your chances.";
  if (score >= 20)
    return "Low match with the job requirements. Significant skill gaps exist.";
  return "Very low match. Consider building the required skills before applying.";
}

/* ── Score Ring Component ────────────────────── */
function ScoreRing({ score }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const [displayScore, setDisplayScore] = useState(0);
  const [offset, setOffset] = useState(circumference);
  const colorClass = getScoreClass(score);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
      // Animate counter
      let start = 0;
      const step = Math.ceil(score / 60);
      const interval = setInterval(() => {
        start += step;
        if (start >= score) {
          setDisplayScore(score);
          clearInterval(interval);
        } else {
          setDisplayScore(start);
        }
      }, 20);
    }, 200);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const strokeColor = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div className="score-ring-wrapper">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          className="score-ring-bg"
          cx="60"
          cy="60"
          r={radius}
        />
        <circle
          className={`score-ring-fill ${colorClass}`}
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={strokeColor}
        />
      </svg>
      <div className="score-ring-text">
        <span className={`score-value ${colorClass}`}>{displayScore}%</span>
        <span className="score-label">Match</span>
      </div>
    </div>
  );
}

/* ── Toast Component ─────────────────────────── */
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icon = type === "error" ? "⚠️" : "✅";
  return (
    <div className={`toast ${type}`} role="alert">
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

/* ── Main App ────────────────────────────────── */
function App() {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [resumePreview, setResumePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [jobSkills, setJobSkills] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadDone, setUploadDone] = useState(false);

  const resultsRef = useRef(null);

  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  /* ── Upload Handler ── */
  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a PDF resume first.", "error");
      return;
    }
    setLoading(true);
    setLoadingAction("Parsing resume…");
    setMatchResult(null);
    setSkills([]);
    setUploadDone(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setSkills(data.skills || []);
      setResumePreview(data.preview_text || "");
      setUploadDone(true);
      showToast(`Found ${(data.skills || []).length} skills in your resume!`, "success");
    } catch (err) {
      showToast("Failed to connect to the backend. Make sure it's running.", "error");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  /* ── Match Handler ── */
  const handleMatch = async () => {
    if (!jobSkills.trim()) {
      showToast("Please enter job skills to compare.", "error");
      return;
    }
    if (skills.length === 0) {
      showToast("Upload and analyze your resume first.", "error");
      return;
    }

    setLoading(true);
    setLoadingAction("Calculating match score…");

    try {
      const jobSkillsArray = jobSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("http://127.0.0.1:5000/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_skills: skills,
          job_skills: jobSkillsArray,
        }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setMatchResult(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      showToast("Failed to calculate match. Check backend connection.", "error");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  /* ── File Drag & Drop ── */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setUploadDone(false);
      setMatchResult(null);
      setSkills([]);
    } else {
      showToast("Only PDF files are accepted.", "error");
    }
  };

  /* ── Render ── */
  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-badge">
          <span className="badge-dot" />
          AI-Powered Analysis
        </div>
        <h1 className="app-title">Resume Analyzer</h1>
        <p className="app-subtitle">
          Upload your resume and discover how well you match any job — powered by NLP.
        </p>
      </header>

      {/* Main Card */}
      <main className="main-card" role="main">
        {/* Step 1: Upload */}
        <div className="section-label">
          <span className="label-icon">📄</span>
          Step 1 — Upload Your Resume
        </div>

        <div
          className={`upload-zone ${file ? "has-file" : ""}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          aria-label="Resume upload area"
        >
          <input
            type="file"
            id="fileUpload"
            accept=".pdf"
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              setUploadDone(false);
              setMatchResult(null);
              setSkills([]);
            }}
            aria-label="Choose PDF file"
          />
          <span className="upload-icon" role="img" aria-label="Upload">
            {file ? "📎" : "☁️"}
          </span>
          <p className="upload-text-primary">
            {file ? "File ready to analyze" : "Drag & drop your PDF here"}
          </p>
          <p className="upload-text-secondary">
            {file ? "Click to choose a different file" : "or click to browse — PDF only"}
          </p>
          {file && (
            <span className="file-name-display">
              ✓ {file.name}
            </span>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            id="uploadBtn"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={loading || !file}
            aria-busy={loading && loadingAction.includes("Parsing")}
          >
            {loading && loadingAction.includes("Parsing") ? (
              <>
                <span className="spinner" /> {loadingAction}
              </>
            ) : uploadDone ? (
              <> ✓ Resume Analyzed — Re-analyze</>
            ) : (
              <> 🔍 Analyze Resume</>
            )}
          </button>
        </div>

        {/* Skills Result */}
        {skills.length > 0 && (
          <>
            <div className="section-divider" />
            <div className="section-label">
              <span className="label-icon">⚡</span>
              Detected Skills ({skills.length})
            </div>
            <div className="skills-container" role="list" aria-label="Detected skills">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="skill-tag default"
                  role="listitem"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className="skill-dot default" />
                  {skill}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="section-divider" />

        {/* Step 2: Job Skills Input */}
        <div className="section-label">
          <span className="label-icon">💼</span>
          Step 2 — Enter Job Requirements
        </div>

        <input
          id="jobSkillsInput"
          type="text"
          className="text-input"
          value={jobSkills}
          onChange={(e) => setJobSkills(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleMatch()}
          placeholder="e.g. python, sql, machine learning, react, node.js"
          aria-label="Job skills (comma separated)"
        />

        <div style={{ marginTop: 16 }}>
          <button
            id="matchBtn"
            className="btn btn-success"
            onClick={handleMatch}
            disabled={loading || !jobSkills.trim()}
            aria-busy={loading && loadingAction.includes("Calculating")}
          >
            {loading && loadingAction.includes("Calculating") ? (
              <>
                <span className="spinner" /> {loadingAction}
              </>
            ) : (
              <> 📊 Check Job Match</>
            )}
          </button>
        </div>

        <div className="tip-box" role="note">
          <span className="tip-icon">💡</span>
          <span>
            Tip: Separate skills with commas. You can paste skills directly from a
            job posting for the most accurate results.
          </span>
        </div>
      </main>

      {/* Results Card */}
      {matchResult && (
        <section
          className="main-card results-card"
          ref={resultsRef}
          aria-label="Match results"
          style={{ marginTop: 24 }}
        >
          {/* Score Overview */}
          <div className="score-section">
            <ScoreRing score={matchResult.match_score} />
            <div className="score-info">
              <h2 className={`score-title ${getScoreClass(matchResult.match_score)}`}>
                {getScoreLabel(matchResult.match_score)}
              </h2>
              <p className="score-description">
                {getScoreDescription(matchResult.match_score)}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-pill">
              <div className="stat-pill-number" style={{ color: "#818cf8" }}>
                {skills.length}
              </div>
              <div className="stat-pill-label">Resume Skills</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-number" style={{ color: "#34d399" }}>
                {matchResult.matched_skills.length}
              </div>
              <div className="stat-pill-label">Matched</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-number" style={{ color: "#f87171" }}>
                {matchResult.missing_skills.length}
              </div>
              <div className="stat-pill-label">Missing</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar-wrapper" aria-label="Match score progress bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${matchResult.match_score}%`,
                background:
                  matchResult.match_score >= 70
                    ? "linear-gradient(90deg, #059669, #34d399)"
                    : matchResult.match_score >= 40
                    ? "linear-gradient(90deg, #d97706, #fbbf24)"
                    : "linear-gradient(90deg, #dc2626, #f87171)",
              }}
              role="progressbar"
              aria-valuenow={matchResult.match_score}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="section-divider" />

          {/* Matched Skills */}
          <div className="result-subsection">
            <div className="result-subsection-title">
              <span className="result-icon">✅</span>
              Matched Skills ({matchResult.matched_skills.length})
            </div>
            {matchResult.matched_skills.length > 0 ? (
              <div className="skills-container" role="list" aria-label="Matched skills">
                {matchResult.matched_skills.map((s, i) => (
                  <span
                    key={i}
                    className="skill-tag matched"
                    role="listitem"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className="skill-dot matched" />
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-state">No skills matched the job requirements.</div>
            )}
          </div>

          <div className="section-divider" />

          {/* Missing Skills */}
          <div className="result-subsection">
            <div className="result-subsection-title">
              <span className="result-icon">⚠️</span>
              Skills to Acquire ({matchResult.missing_skills.length})
            </div>
            {matchResult.missing_skills.length > 0 ? (
              <>
                <div className="skills-container" role="list" aria-label="Missing skills">
                  {matchResult.missing_skills.map((s, i) => (
                    <span
                      key={i}
                      className="skill-tag missing"
                      role="listitem"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <span className="skill-dot missing" />
                      {s}
                    </span>
                  ))}
                </div>
                <div className="tip-box" style={{ marginTop: 16 }}>
                  <span className="tip-icon">🎯</span>
                  <span>
                    Focus on learning these {matchResult.missing_skills.length} skill
                    {matchResult.missing_skills.length > 1 ? "s" : ""} to significantly
                    boost your match score and improve your candidacy.
                  </span>
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ color: "#6ee7b7" }}>
                🎉 Your resume covers all required skills!
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built with <span style={{ color: "#f87171" }}>♥</span> using React &amp; Flask &nbsp;·&nbsp;
          Powered by spaCy NLP
        </p>
      </footer>

      {/* Toast Notifications */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
      )}
    </div>
  );
}

export default App;