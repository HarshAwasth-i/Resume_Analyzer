import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

/* ── Score Tier Helper ──────────────────────── */
function getScoreTier(score) {
  if (score >= 80) return { label: "Strong Match", class: "score-high" };
  if (score >= 60) return { label: "Good Match", class: "score-medium" };
  if (score >= 40) return { label: "Moderate Match", class: "score-warning" };
  return { label: "Low Match", class: "score-low" };
}

/* ── Score Ring Component ────────────────────── */
function ScoreRing({ score, size = 130, strokeWidth = 9, label = "Match Score" }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const [displayScore, setDisplayScore] = useState(0);
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
      let current = 0;
      const step = Math.max(1, Math.ceil(score / 40));
      const interval = setInterval(() => {
        current += step;
        if (current >= score) {
          setDisplayScore(score);
          clearInterval(interval);
        } else {
          setDisplayScore(current);
        }
      }, 20);
    }, 150);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const strokeColor =
    score >= 80 ? "#10b981" : score >= 60 ? "#34d399" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="score-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="score-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={strokeColor}
          strokeLinecap="round"
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-number" style={{ color: strokeColor }}>
          {displayScore}%
        </span>
        <span className="score-subtext">{label}</span>
      </div>
    </div>
  );
}

/* ── Toast Notification Component ────────────── */
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`toast-notification ${type}`} role="alert">
      <span className="toast-icon">
        {type === "error" ? "✕" : type === "success" ? "✓" : "ℹ"}
      </span>
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Close notification">
        ✕
      </button>
    </div>
  );
}

/* ── Main App Component ──────────────────────── */
export default function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState([]);
  const [categorizedSkills, setCategorizedSkills] = useState({});
  const [resumeAudit, setResumeAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [uploadDone, setUploadDone] = useState(false);

  // Job matching states
  const [jobInputMode, setJobInputMode] = useState("description"); // "description" | "skills"
  const [jobDescription, setJobDescription] = useState("");
  const [jobSkillsManual, setJobSkillsManual] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [activeSkillFilter, setActiveSkillFilter] = useState("all");
  const [showRawResume, setShowRawResume] = useState(false);
  const [toast, setToast] = useState(null);

  const resultsRef = useRef(null);

  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  /* ── File Selection & Drag-and-Drop ── */
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please upload a PDF document.", "error");
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    const sizeInKB = Math.round(selectedFile.size / 1024);
    setFileSize(sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`);
    setUploadDone(false);
    setMatchResult(null);
    setSkills([]);
    setResumeAudit(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  /* ── Step 1: Upload & Parse Resume ── */
  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a PDF file first.", "error");
      return;
    }

    setLoading(true);
    setLoadingStep("Analyzing resume…");
    setMatchResult(null);
    setSkills([]);
    setUploadDone(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setSkills(data.skills || []);
      setCategorizedSkills(data.categorized_skills || {});
      setResumeAudit(data.audit || null);
      setResumeText(data.full_text || data.preview_text || "");
      setUploadDone(true);
      showToast(`Detected ${data.skills?.length || 0} skills from resume.`, "success");
    } catch (err) {
      console.error(err);
      showToast(
        err.message.includes("Failed to fetch")
          ? "Backend is not responding. Please make sure the Flask server is running."
          : err.message,
        "error"
      );
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  /* ── Step 2: Compare Against Job Description ── */
  const handleMatch = async () => {
    if (skills.length === 0 && !resumeText) {
      showToast("Please upload and analyze your resume first.", "error");
      return;
    }

    const hasDesc = jobDescription.trim().length > 0;
    const hasSkills = jobSkillsManual.trim().length > 0;

    if (!hasDesc && !hasSkills) {
      showToast("Please paste a job description or enter required skills.", "error");
      return;
    }

    setLoading(true);
    setLoadingStep("Matching skills and computing score…");

    try {
      const manualArray = jobSkillsManual
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          resume_skills: skills,
          job_description: jobDescription,
          job_skills: manualArray,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Match request failed.");
      }

      const data = await res.json();
      setMatchResult(data);
      showToast("Analysis complete.", "success");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      console.error(err);
      showToast(
        err.message.includes("Failed to fetch")
          ? "Could not reach the server. Make sure Python Flask is running."
          : err.message,
        "error"
      );
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  /* ── Print / Save Report ── */
  const handlePrint = () => {
    window.print();
  };

  /* ── Copy Missing Skills ── */
  const handleCopyMissing = () => {
    if (!matchResult?.missing_skills?.length) return;
    navigator.clipboard.writeText(matchResult.missing_skills.join(", "));
    showToast("Missing skills copied to clipboard.", "success");
  };

  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">📄</span>
            <span className="brand-name">Resume Analyzer</span>
          </div>

          <div className="nav-actions">
            {matchResult && (
              <button
                className="btn btn-secondary print-hide"
                onClick={handlePrint}
              >
                Print Report
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="page-header">
        <h1 className="page-title">Resume &amp; Job Description Analyzer</h1>
        <p className="page-subtitle">
          Upload your resume and compare it against any job posting to discover skill coverage,
          ATS structural completeness, and targeted recommendations.
        </p>
      </header>

      {/* Main 2-Column Grid */}
      <div className="analyzer-grid">
        {/* Step 1: Resume Upload Card */}
        <section className="card" aria-label="Resume upload section">
          <div className="card-header">
            <span className="step-tag">Step 1</span>
            <h2 className="card-title">Upload Resume</h2>
            <p className="card-desc">PDF format only</p>
          </div>

          {/* Upload Dropzone */}
          <div
            className={`dropzone ${file ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput")?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("fileInput")?.click()}
            aria-label="Upload PDF Resume"
          >
            <input
              type="file"
              id="fileInput"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />

            <div className="dropzone-icon">{file ? "📄" : "📁"}</div>

            {fileName ? (
              <div className="dropzone-info">
                <span className="file-name">{fileName}</span>
                <span className="file-size">{fileSize}</span>
                <span className="replace-text">Click or drop to replace</span>
              </div>
            ) : (
              <div className="dropzone-info">
                <p className="dropzone-main">Choose a PDF resume or drag it here</p>
                <p className="dropzone-sub">Supported file type: .pdf</p>
              </div>
            )}
          </div>

          <div className="card-actions">
            <button
              id="analyzeResumeBtn"
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading && loadingStep.includes("Analyzing") ? (
                <>
                  <span className="spinner" /> {loadingStep}
                </>
              ) : uploadDone ? (
                <>✓ Resume Analyzed — Re-analyze</>
              ) : (
                <>Analyze Resume</>
              )}
            </button>
          </div>

          {/* Document Health Checklist */}
          {resumeAudit && (
            <div className="audit-box">
              <div className="audit-top">
                <span className="audit-heading">Document Checks</span>
                <span className="audit-score-pill">
                  Structure: {resumeAudit.structure_score}%
                </span>
              </div>

              <div className="audit-checklist">
                <div className={`check-pill ${resumeAudit.contact_info.has_email ? "ok" : "warn"}`}>
                  <span>{resumeAudit.contact_info.has_email ? "✓" : "–"} Email</span>
                </div>
                <div className={`check-pill ${resumeAudit.contact_info.has_phone ? "ok" : "warn"}`}>
                  <span>{resumeAudit.contact_info.has_phone ? "✓" : "–"} Phone</span>
                </div>
                <div className={`check-pill ${resumeAudit.contact_info.has_linkedin ? "ok" : "warn"}`}>
                  <span>{resumeAudit.contact_info.has_linkedin ? "✓" : "–"} LinkedIn</span>
                </div>
                <div className={`check-pill ${resumeAudit.contact_info.has_github ? "ok" : "warn"}`}>
                  <span>{resumeAudit.contact_info.has_github ? "✓" : "–"} GitHub</span>
                </div>
                <div className={`check-pill ${resumeAudit.sections.experience ? "ok" : "warn"}`}>
                  <span>{resumeAudit.sections.experience ? "✓" : "–"} Experience</span>
                </div>
                <div className={`check-pill ${resumeAudit.sections.education ? "ok" : "warn"}`}>
                  <span>{resumeAudit.sections.education ? "✓" : "–"} Education</span>
                </div>
                <div className={`check-pill ${resumeAudit.sections.skills ? "ok" : "warn"}`}>
                  <span>{resumeAudit.sections.skills ? "✓" : "–"} Skills</span>
                </div>
                <div className={`check-pill ${resumeAudit.sections.projects ? "ok" : "warn"}`}>
                  <span>{resumeAudit.sections.projects ? "✓" : "–"} Projects</span>
                </div>
              </div>

              <div className="audit-stats-row">
                <div className="audit-stat">
                  <span className="stat-number">{resumeAudit.word_count}</span>
                  <span className="stat-name">Words</span>
                </div>
                <div className="audit-stat">
                  <span className="stat-number">{resumeAudit.action_verb_count}</span>
                  <span className="stat-name">Action Verbs</span>
                </div>
                <div className="audit-stat">
                  <span className="stat-number">{resumeAudit.quantifiable_metrics_count}</span>
                  <span className="stat-name">Metrics</span>
                </div>
              </div>

              {resumeText && (
                <div className="text-viewer-toggle">
                  <button
                    className="btn-link"
                    onClick={() => setShowRawResume(!showRawResume)}
                  >
                    {showRawResume ? "Hide extracted text" : "View extracted text"}
                  </button>
                  {showRawResume && (
                    <div className="text-viewer-box">
                      <pre>{resumeText}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detected Skills */}
          {skills.length > 0 && (
            <div className="skills-summary">
              <h3 className="section-label">
                Detected Resume Skills ({skills.length})
              </h3>
              {Object.keys(categorizedSkills).length > 0 ? (
                <div className="skills-categories">
                  {Object.entries(categorizedSkills).map(([category, catSkills]) => (
                    <div key={category} className="cat-block">
                      <span className="cat-title">{category}</span>
                      <div className="pills-wrap">
                        {catSkills.map((s, idx) => (
                          <span key={idx} className="skill-chip">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pills-wrap">
                  {skills.map((s, idx) => (
                    <span key={idx} className="skill-chip">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Job Description Card */}
        <section className="card" aria-label="Job description input section">
          <div className="card-header">
            <span className="step-tag">Step 2</span>
            <h2 className="card-title">Job Requirements</h2>
            <p className="card-desc">Paste the job description or enter required skills</p>
          </div>

          {/* Mode Switcher */}
          <div className="tab-switch">
            <button
              className={`tab-item ${jobInputMode === "description" ? "active" : ""}`}
              onClick={() => setJobInputMode("description")}
            >
              Job Description
            </button>
            <button
              className={`tab-item ${jobInputMode === "skills" ? "active" : ""}`}
              onClick={() => setJobInputMode("skills")}
            >
              Specific Skills List
            </button>
          </div>

          {jobInputMode === "description" ? (
            <div className="input-group">
              <textarea
                id="jobDescriptionInput"
                className="form-textarea"
                rows={10}
                placeholder="Paste the job requirements or full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="textarea-meta">
                <span>{jobDescription.length} characters</span>
                {jobDescription && (
                  <button
                    className="btn-link-danger"
                    onClick={() => setJobDescription("")}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="input-group">
              <input
                id="jobSkillsInput"
                type="text"
                className="form-input"
                placeholder="e.g. Python, React, SQL, Docker, AWS"
                value={jobSkillsManual}
                onChange={(e) => setJobSkillsManual(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMatch()}
              />
              <p className="field-hint">
                Separate required skills with commas.
              </p>
            </div>
          )}

          <div className="card-actions">
            <button
              id="calculateMatchBtn"
              className="btn btn-primary"
              onClick={handleMatch}
              disabled={loading || (skills.length === 0 && !resumeText)}
            >
              {loading && loadingStep.includes("Matching") ? (
                <>
                  <span className="spinner" /> {loadingStep}
                </>
              ) : (
                <>Compare &amp; Match</>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Step 3: Analysis Results */}
      {matchResult && (
        <section
          className="card results-card"
          ref={resultsRef}
          aria-label="Comparison results"
        >
          <div className="results-overview">
            <ScoreRing
              score={matchResult.composite_score}
              size={140}
              label="Overall Match"
            />
            <div className="overview-details">
              <div className="tier-line">
                <span className={`status-badge ${getScoreTier(matchResult.composite_score).class}`}>
                  {getScoreTier(matchResult.composite_score).label}
                </span>
                <span className="score-summary-text">
                  Overall Score: {matchResult.composite_score}%
                </span>
              </div>
              <h2 className="overview-title">
                {matchResult.composite_score >= 70
                  ? "Good overall alignment with this position"
                  : matchResult.composite_score >= 45
                  ? "Moderate alignment with some skill gaps"
                  : "Low alignment with requirements"}
              </h2>
              <p className="overview-description">
                {matchResult.composite_score >= 70
                  ? "Your resume covers the key technical requirements for this role. Review the checklist below for any minor gaps."
                  : matchResult.composite_score >= 45
                  ? "Several required skills or keywords were not identified in your resume. Consider incorporating the missing items listed below."
                  : "Significant skill and keyword gaps exist between your resume and the job description. Tailoring your resume will improve your candidacy."}
              </p>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="metrics-row">
            <div className="metric-box">
              <span className="metric-label">Skill Coverage</span>
              <span className="metric-val">{matchResult.skill_match_score}%</span>
              <span className="metric-sub">
                {matchResult.matched_skills.length} of {matchResult.total_required_skills} skills found
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Context Similarity</span>
              <span className="metric-val">{matchResult.semantic_score}%</span>
              <span className="metric-sub">
                Textual alignment with job description
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">ATS Structure</span>
              <span className="metric-val">{matchResult.structure_score}%</span>
              <span className="metric-sub">
                Contact information &amp; section headers
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Action &amp; Impact</span>
              <span className="metric-val">{matchResult.impact_score}%</span>
              <span className="metric-sub">
                Action verbs and quantifiable metrics
              </span>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="skill-breakdown">
            <div className="breakdown-header">
              <h3 className="breakdown-title">Skill Match Details</h3>
              <div className="filter-controls">
                <button
                  className={`filter-tab ${activeSkillFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveSkillFilter("all")}
                >
                  All ({matchResult.matched_skills.length + matchResult.missing_skills.length})
                </button>
                <button
                  className={`filter-tab ${activeSkillFilter === "matched" ? "active" : ""}`}
                  onClick={() => setActiveSkillFilter("matched")}
                >
                  Matched ({matchResult.matched_skills.length})
                </button>
                <button
                  className={`filter-tab ${activeSkillFilter === "missing" ? "active" : ""}`}
                  onClick={() => setActiveSkillFilter("missing")}
                >
                  Missing ({matchResult.missing_skills.length})
                </button>
              </div>
            </div>

            {/* Matched skills */}
            {(activeSkillFilter === "all" || activeSkillFilter === "matched") && (
              <div className="skill-group">
                <span className="group-title text-success">
                  Matched Skills ({matchResult.matched_skills.length})
                </span>
                {matchResult.matched_skills.length > 0 ? (
                  <div className="pills-wrap">
                    {matchResult.matched_skills.map((s, idx) => (
                      <span key={idx} className="skill-chip matched">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="no-items-text">No required skills matched your resume.</p>
                )}
              </div>
            )}

            {/* Missing skills */}
            {(activeSkillFilter === "all" || activeSkillFilter === "missing") && (
              <div className="skill-group">
                <div className="group-title-row">
                  <span className="group-title text-danger">
                    Missing Skills ({matchResult.missing_skills.length})
                  </span>
                  {matchResult.missing_skills.length > 0 && (
                    <button className="btn-small" onClick={handleCopyMissing}>
                      Copy Missing Skills
                    </button>
                  )}
                </div>
                {matchResult.missing_skills.length > 0 ? (
                  <div className="pills-wrap">
                    {matchResult.missing_skills.map((s, idx) => (
                      <span key={idx} className="skill-chip missing">
                        ✕ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="no-items-text text-success">
                    All required skills are present on your resume.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {matchResult.recommendations && matchResult.recommendations.length > 0 && (
            <div className="recommendations-container">
              <h3 className="breakdown-title">Suggestions for Improvement</h3>
              <div className="rec-list">
                {matchResult.recommendations.map((rec, idx) => (
                  <div key={idx} className={`rec-card ${rec.type}`}>
                    <h4 className="rec-head">{rec.title}</h4>
                    <p className="rec-desc">{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-actions print-hide">
            <button className="btn btn-secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Back to Top
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              Print Report
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer print-hide">
        <p>Resume Analyzer &bull; Built with React &amp; Flask</p>
      </footer>

      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}