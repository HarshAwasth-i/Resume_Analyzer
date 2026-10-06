import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

/* ── Fallback Sample Data for Instant Testing ── */
const SAMPLE_PRESETS = [
  {
    id: "fullstack",
    title: "Full Stack Engineer",
    badge: "🚀 Full Stack",
    description: `We are looking for a Senior Full Stack Engineer to build scalable web applications.
Key Requirements:
- Strong experience with React, TypeScript, and modern JavaScript.
- Backend proficiency in Node.js, Express, or Python (Flask / FastAPI).
- Experience designing REST APIs and querying PostgreSQL or MongoDB.
- Familiarity with Docker, Git, CI/CD pipelines, and AWS cloud deployment.
- Understanding of Unit Testing, System Design, and Agile/Scrum workflows.
- Excellent communication and problem-solving skills.`
  },
  {
    id: "aiml",
    title: "AI & Machine Learning Engineer",
    badge: "🤖 AI / ML",
    description: `Seeking an innovative Machine Learning Engineer to design and deploy AI systems.
Key Requirements:
- Deep knowledge of Python, NumPy, Pandas, and Scikit-Learn.
- Experience with Deep Learning frameworks: PyTorch or TensorFlow.
- Hands-on NLP experience (Natural Language Processing, LLMs, Hugging Face).
- Knowledge of Data Analysis, Computer Vision, and model evaluation metrics.
- Familiarity with Docker, Linux, Git, and cloud services (AWS or Azure).
- Proven ability to write clean code and conduct unit testing.`
  },
  {
    id: "devops",
    title: "Cloud & DevOps Engineer",
    badge: "☁️ Cloud & DevOps",
    description: `Looking for a DevOps Engineer to automate and scale our cloud infrastructure.
Key Requirements:
- Extensive experience with Docker, Kubernetes, and container orchestration.
- Cloud expertise in AWS or Google Cloud (GCP).
- Infrastructure as Code (IaC) using Terraform or Ansible.
- Strong knowledge of CI/CD pipelines (Jenkins, GitHub Actions, GitLab CI).
- Linux system administration, Bash/Shell scripting, and Python automation.
- Experience monitoring with Prometheus, Grafana, and Nginx.`
  }
];

const DEMO_RESUME_TEXT = `Alex Mercer
Senior Software Engineer
alex.mercer@email.com | (555) 234-5678 | linkedin.com/in/alexmercer | github.com/alexmercer

Professional Summary
Results-driven software engineer with 5+ years of experience developing scalable distributed web applications, cloud infrastructure, and AI-enabled tools.

Technical Skills
Languages: Python, TypeScript, JavaScript, SQL, HTML5, CSS3, Bash, C++
Frameworks: React, Node.js, Express, Next.js, Flask, Tailwind CSS, Redux
Databases & Cloud: PostgreSQL, MongoDB, Redis, AWS, Docker, Kubernetes, Git
Methods: REST APIs, Microservices, System Design, Agile, Unit Testing, CI/CD

Work Experience
Senior Full Stack Engineer — CloudTech Systems (2022 - Present)
- Architected and deployed microservices on AWS and Docker, serving over 1.5M active monthly users.
- Spearheaded database optimization for PostgreSQL and Redis, reducing query response times by 42%.
- Engineered automated CI/CD deployment pipelines using GitHub Actions, accelerating release cycles by 3x.
- Mentored junior engineers and led bi-weekly Agile sprint retrospectives.

Software Engineer — Nova Web Labs (2019 - 2022)
- Built interactive frontend user interfaces using React, TypeScript, and Redux with 99.9% uptime.
- Developed backend REST APIs with Python Flask and Node.js for financial data processing.
- Increased test coverage by 35% through comprehensive unit testing and integration testing.

Education
B.S. in Computer Science — California Institute of Technology (2019)`;

/* ── Helpers ─────────────────────────────────── */
function getScoreTier(score) {
  if (score >= 80) return { label: "Excellent Match", class: "score-high", badge: "ATS Ready" };
  if (score >= 60) return { label: "Competitive Match", class: "score-medium-high", badge: "Strong Fit" };
  if (score >= 40) return { label: "Moderate Match", class: "score-medium", badge: "Skill Gaps" };
  return { label: "Needs Optimization", class: "score-low", badge: "Low Match" };
}

/* ── Animated SVG Score Ring ──────────────────── */
function ScoreRing({ score, size = 140, strokeWidth = 10, label = "ATS Match" }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const [displayScore, setDisplayScore] = useState(0);
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
      let current = 0;
      const step = Math.max(1, Math.ceil(score / 50));
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
    score >= 80 ? "#10b981" : score >= 60 ? "#06b6d4" : score >= 40 ? "#f59e0b" : "#ef4444";

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

/* ── Toast Notification ──────────────────────── */
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    error: "⚠️",
    success: "✨",
    info: "💡"
  };

  return (
    <div className={`toast-notification ${type}`} role="alert">
      <span className="toast-icon">{icons[type] || "ℹ️"}</span>
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
        ✕
      </button>
    </div>
  );
}

/* ── Main Application Component ──────────────── */
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
  const [activeSkillFilter, setActiveSkillFilter] = useState("all"); // "all" | "matched" | "missing"
  const [showRawResume, setShowRawResume] = useState(false);
  const [toast, setToast] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  const resultsRef = useRef(null);

  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // Health check on mount
  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then((res) => {
        if (res.ok) setBackendOnline(true);
      })
      .catch(() => setBackendOnline(false));
  }, []);

  /* ── Demo Resume Loader ── */
  const handleLoadDemo = () => {
    setFile(null);
    setFileName("sample_senior_engineer_resume.pdf (Demo)");
    setFileSize("145 KB");
    setResumeText(DEMO_RESUME_TEXT);
    setLoading(true);
    setLoadingStep("Parsing demo resume…");
    setMatchResult(null);

    // Call match directly or simulate extraction
    setTimeout(() => {
      // Analyze demo resume text locally / via state
      const demoSkills = [
        "AWS", "Agile", "Bash", "C++", "CI/CD", "CSS3", "Docker", "Express",
        "Flask", "Git", "HTML5", "JavaScript", "Kubernetes", "Microservices",
        "MongoDB", "Next.js", "Node.js", "PostgreSQL", "Python", "React",
        "Redis", "Redux", "REST APIs", "SQL", "System Design", "Tailwind CSS",
        "TypeScript", "Unit Testing"
      ];
      setSkills(demoSkills);
      setCategorizedSkills({
        "Languages": ["Bash", "C++", "CSS3", "HTML5", "JavaScript", "Python", "SQL", "TypeScript"],
        "Frameworks & Web": ["Express", "Flask", "Next.js", "Node.js", "React", "Redux", "Tailwind CSS"],
        "Databases": ["MongoDB", "PostgreSQL", "Redis"],
        "Cloud & DevOps": ["AWS", "CI/CD", "Docker", "Git", "Kubernetes"],
        "Tools & Architecture": ["Microservices", "REST APIs", "System Design", "Unit Testing", "Agile"]
      });
      setResumeAudit({
        structure_score: 95,
        impact_score: 85,
        word_count: 240,
        estimated_read_time_min: 1.2,
        action_verb_count: 7,
        action_verbs: ["architected", "deployed", "engineered", "mentored", "optimized", "reduced", "spearheaded"],
        quantifiable_metrics_count: 5,
        contact_info: {
          has_email: true,
          email: "alex.mercer@email.com",
          has_phone: true,
          phone: "(555) 234-5678",
          has_linkedin: true,
          has_github: true
        },
        sections: {
          experience: true,
          education: true,
          skills: true,
          projects: true,
          summary: true,
          certifications: false
        }
      });
      setUploadDone(true);
      setLoading(false);
      setLoadingStep("");
      showToast("Demo resume loaded successfully! Now pick a job preset below.", "success");
    }, 600);
  };

  /* ── File Selection & Drag-and-Drop ── */
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please select a valid PDF file.", "error");
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
    if (!file && !resumeText) {
      showToast("Please choose a PDF resume file or load the demo.", "error");
      return;
    }

    // If using loaded demo without a file stream
    if (!file && resumeText) {
      showToast("Resume is already loaded! Choose a job preset in Step 2.", "info");
      return;
    }

    setLoading(true);
    setLoadingStep("Extracting text and identifying skills via NLP…");
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
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setSkills(data.skills || []);
      setCategorizedSkills(data.categorized_skills || {});
      setResumeAudit(data.audit || null);
      setResumeText(data.full_text || data.preview_text || "");
      setUploadDone(true);
      showToast(`Extracted ${data.skills?.length || 0} skills and analyzed structure!`, "success");
    } catch (err) {
      console.error(err);
      showToast(
        err.message.includes("Failed to fetch")
          ? "Cannot connect to the backend server. Make sure Python Flask is running on port 5000."
          : err.message,
        "error"
      );
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  /* ── Step 2: Compare with Job Description ── */
  const handleMatch = async () => {
    if (skills.length === 0 && !resumeText) {
      showToast("Please upload and analyze a resume first.", "error");
      return;
    }

    const hasDesc = jobDescription.trim().length > 0;
    const hasSkills = jobSkillsManual.trim().length > 0;

    if (!hasDesc && !hasSkills) {
      showToast("Please paste a job description or select one of the quick presets below.", "error");
      return;
    }

    setLoading(true);
    setLoadingStep("Calculating ATS score, semantic match, and skill gaps…");

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
        throw new Error(errData.error || "Failed to calculate match.");
      }

      const data = await res.json();
      setMatchResult(data);
      showToast("Analysis complete! Review your ATS score and recommendations below.", "success");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err) {
      console.error(err);
      showToast(
        err.message.includes("Failed to fetch")
          ? "Connection error. Make sure the backend service is running."
          : err.message,
        "error"
      );
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  /* ── Preset Job Selector ── */
  const handleSelectPreset = (preset) => {
    setJobInputMode("description");
    setJobDescription(preset.description);
    showToast(`Loaded ${preset.title} requirements! Click 'Calculate Match' to evaluate.`, "info");
  };

  /* ── Export / Print Handler ── */
  const handlePrint = () => {
    window.print();
  };

  /* ── Copy Missing Skills to Clipboard ── */
  const handleCopyMissing = () => {
    if (!matchResult?.missing_skills?.length) return;
    navigator.clipboard.writeText(matchResult.missing_skills.join(", "));
    showToast("Missing skills copied to clipboard!", "success");
  };

  return (
    <div className="app-wrapper">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-logo" role="img" aria-label="Logo">📄</span>
            <div className="brand-titles">
              <span className="brand-name">ResumeAI Analyzer</span>
              <span className="brand-version">v2.0 Pro</span>
            </div>
          </div>

          <div className="nav-actions">
            <div className={`status-pill ${backendOnline ? "online" : "offline"}`}>
              <span className="status-dot" />
              <span>{backendOnline ? "API Online" : "Connecting..."}</span>
            </div>

            <button
              className="btn btn-secondary nav-btn"
              onClick={handleLoadDemo}
              title="Test the analyzer instantly with a pre-configured sample resume"
            >
              ⚡ Load Sample Resume
            </button>

            {matchResult && (
              <button
                className="btn btn-primary nav-btn print-hide"
                onClick={handlePrint}
              >
                🖨️ Export Report
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-header">
        <div className="header-badge">
          <span className="badge-sparkle">✨</span>
          <span>Next-Gen ATS &amp; Semantic Resume Intelligence</span>
        </div>
        <h1 className="hero-title">
          Supercharge Your Resume For <span className="gradient-text">Any Role</span>
        </h1>
        <p className="hero-subtitle">
          Extract technical skills, detect critical ATS formatting gaps, compute semantic match
          scores against real job descriptions, and unlock actionable recommendations.
        </p>
      </header>

      {/* Main Grid Container */}
      <div className="analyzer-grid">
        {/* Left Column / Card 1: Resume Intake */}
        <section className="dashboard-card" aria-label="Resume Upload Section">
          <div className="card-header">
            <div className="step-indicator">1</div>
            <div className="card-header-titles">
              <h2 className="card-title">Upload &amp; Parse Resume</h2>
              <p className="card-description">Upload your PDF or use our sample resume</p>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`dropzone ${file || resumeText ? "has-file" : ""}`}
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

            <div className="dropzone-icon">
              {file || resumeText ? "📑" : "☁️"}
            </div>

            {fileName ? (
              <div className="dropzone-file-info">
                <span className="dropzone-filename">{fileName}</span>
                <span className="dropzone-filesize">{fileSize}</span>
                <span className="dropzone-hint">Click or drop to replace file</span>
              </div>
            ) : (
              <div className="dropzone-text-group">
                <p className="dropzone-primary">Drag &amp; drop your resume PDF here</p>
                <p className="dropzone-secondary">or click to browse your device (PDF up to 10MB)</p>
              </div>
            )}
          </div>

          {/* Analyze Resume Button */}
          <div className="action-row">
            <button
              id="analyzeResumeBtn"
              className="btn btn-primary btn-block"
              onClick={handleUpload}
              disabled={loading || (!file && !resumeText)}
            >
              {loading && loadingStep.includes("Extracting") ? (
                <>
                  <span className="spinner" /> {loadingStep}
                </>
              ) : uploadDone ? (
                <>✓ Resume Parsed — Re-analyze</>
              ) : (
                <>⚡ Extract Skills &amp; Audit Structure</>
              )}
            </button>
          </div>

          {/* Quick Resume Audit Badges */}
          {resumeAudit && (
            <div className="audit-summary-box">
              <div className="audit-header">
                <span className="audit-title">📋 Document Structure Checklist</span>
                <span className="audit-badge">
                  Score: {resumeAudit.structure_score}/100
                </span>
              </div>
              <div className="checklist-grid">
                <div className={`check-item ${resumeAudit.contact_info.has_email ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.contact_info.has_email ? "✓" : "✗"}</span>
                  <span>Email</span>
                </div>
                <div className={`check-item ${resumeAudit.contact_info.has_phone ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.contact_info.has_phone ? "✓" : "✗"}</span>
                  <span>Phone</span>
                </div>
                <div className={`check-item ${resumeAudit.contact_info.has_linkedin ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.contact_info.has_linkedin ? "✓" : "✗"}</span>
                  <span>LinkedIn</span>
                </div>
                <div className={`check-item ${resumeAudit.contact_info.has_github ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.contact_info.has_github ? "✓" : "✗"}</span>
                  <span>GitHub</span>
                </div>
                <div className={`check-item ${resumeAudit.sections.experience ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.sections.experience ? "✓" : "✗"}</span>
                  <span>Experience</span>
                </div>
                <div className={`check-item ${resumeAudit.sections.projects ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.sections.projects ? "✓" : "✗"}</span>
                  <span>Projects</span>
                </div>
                <div className={`check-item ${resumeAudit.sections.education ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.sections.education ? "✓" : "✗"}</span>
                  <span>Education</span>
                </div>
                <div className={`check-item ${resumeAudit.sections.skills ? "valid" : "missing"}`}>
                  <span className="check-icon">{resumeAudit.sections.skills ? "✓" : "✗"}</span>
                  <span>Skills</span>
                </div>
              </div>

              <div className="metrics-summary-bar">
                <div className="metric-col">
                  <span className="metric-val">{resumeAudit.word_count}</span>
                  <span className="metric-sub">Words</span>
                </div>
                <div className="metric-col">
                  <span className="metric-val">{resumeAudit.action_verb_count}</span>
                  <span className="metric-sub">Action Verbs</span>
                </div>
                <div className="metric-col">
                  <span className="metric-val">{resumeAudit.quantifiable_metrics_count}</span>
                  <span className="metric-sub">Metrics</span>
                </div>
              </div>

              {resumeText && (
                <div className="raw-text-toggle-container">
                  <button
                    className="btn-text"
                    onClick={() => setShowRawResume(!showRawResume)}
                  >
                    {showRawResume ? "Hide Parsed Text ▲" : "View Parsed Text ▼"}
                  </button>
                  {showRawResume && (
                    <div className="raw-text-box">
                      <pre>{resumeText}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detected Skills Preview */}
          {skills.length > 0 && (
            <div className="detected-skills-section">
              <div className="section-title-row">
                <h3 className="sub-title">
                  ⚡ Identified Resume Skills ({skills.length})
                </h3>
              </div>

              {/* Categorized badges or flat list */}
              {Object.keys(categorizedSkills).length > 0 ? (
                <div className="categorized-skills-list">
                  {Object.entries(categorizedSkills).map(([category, catSkills]) => (
                    <div key={category} className="category-group">
                      <span className="category-label">{category}</span>
                      <div className="tags-flex">
                        {catSkills.map((s, idx) => (
                          <span key={idx} className="skill-pill default">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tags-flex">
                  {skills.map((s, idx) => (
                    <span key={idx} className="skill-pill default">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column / Card 2: Job Requirements & Comparison */}
        <section className="dashboard-card" aria-label="Job Description Section">
          <div className="card-header">
            <div className="step-indicator">2</div>
            <div className="card-header-titles">
              <h2 className="card-title">Target Job Requirements</h2>
              <p className="card-description">Paste any job posting or select a sample profile</p>
            </div>
          </div>

          {/* Quick Preset Selector Chips */}
          <div className="preset-selector">
            <span className="preset-label">1-Click Presets:</span>
            <div className="preset-chips">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className="preset-chip"
                  onClick={() => handleSelectPreset(preset)}
                >
                  {preset.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Input Mode Tabs */}
          <div className="tabs-bar" role="tablist">
            <button
              className={`tab-btn ${jobInputMode === "description" ? "active" : ""}`}
              onClick={() => setJobInputMode("description")}
              role="tab"
              aria-selected={jobInputMode === "description"}
            >
              📄 Full Job Description (NLP Match)
            </button>
            <button
              className={`tab-btn ${jobInputMode === "skills" ? "active" : ""}`}
              onClick={() => setJobInputMode("skills")}
              role="tab"
              aria-selected={jobInputMode === "skills"}
            >
              🏷️ Specific Skills List
            </button>
          </div>

          {jobInputMode === "description" ? (
            <div className="tab-content">
              <textarea
                id="jobDescriptionInput"
                className="input-textarea"
                rows={9}
                placeholder="Paste the job description from LinkedIn, Indeed, or the job board here...&#10;&#10;Our NLP engine will automatically identify required technologies, calculate TF-IDF semantic alignment, and perform skill-gap detection."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="textarea-footer">
                <span>{jobDescription.length} characters</span>
                {jobDescription && (
                  <button
                    className="btn-text-clear"
                    onClick={() => setJobDescription("")}
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="tab-content">
              <input
                id="jobSkillsInput"
                type="text"
                className="input-text"
                placeholder="e.g. Python, React, Docker, AWS, PostgreSQL, Machine Learning"
                value={jobSkillsManual}
                onChange={(e) => setJobSkillsManual(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMatch()}
              />
              <p className="input-hint">
                💡 Separate skills with commas. The matcher will compare your resume directly against these keywords.
              </p>
            </div>
          )}

          {/* Calculate Match Button */}
          <div className="action-row" style={{ marginTop: 20 }}>
            <button
              id="calculateMatchBtn"
              className="btn btn-accent btn-block"
              onClick={handleMatch}
              disabled={loading || (skills.length === 0 && !resumeText)}
            >
              {loading && loadingStep.includes("Calculating") ? (
                <>
                  <span className="spinner" /> {loadingStep}
                </>
              ) : (
                <>📊 Calculate Match &amp; Generate ATS Report</>
              )}
            </button>
          </div>

          {/* Helpful Tips Card */}
          <div className="tip-callout">
            <span className="tip-callout-icon">💡</span>
            <div className="tip-callout-content">
              <strong>ATS Tip for Job Match:</strong> Pasting a full job description allows
              our semantic model to analyze contextual fit alongside exact keyword coverage,
              providing the most realistic ATS score.
            </div>
          </div>
        </section>
      </div>

      {/* Results Dashboard Section */}
      {matchResult && (
        <section
          className="dashboard-card results-section"
          ref={resultsRef}
          aria-label="Analysis Results"
        >
          <div className="results-hero">
            <div className="results-hero-left">
              <ScoreRing score={matchResult.composite_score} size={150} label="Overall ATS Score" />
            </div>
            <div className="results-hero-right">
              <div className="score-badge-row">
                <span className={`tier-badge ${getScoreTier(matchResult.composite_score).class}`}>
                  {getScoreTier(matchResult.composite_score).badge}
                </span>
                <span className="score-percentage">
                  {matchResult.composite_score}% Match Rating
                </span>
              </div>
              <h2 className="results-headline">
                {getScoreTier(matchResult.composite_score).label}
              </h2>
              <p className="results-narrative">
                {matchResult.composite_score >= 80
                  ? "Outstanding candidate alignment! Your resume clearly emphasizes the core skills, structure, and impact sought in this position."
                  : matchResult.composite_score >= 60
                  ? "Strong foundation with good overlap. Incorporating the highlighted missing keywords and metrics will boost your recruiter shortlisting rate."
                  : matchResult.composite_score >= 40
                  ? "Moderate fit. Notable skill gaps exist between your current profile and the employer's required tech stack."
                  : "Low alignment detected. We strongly suggest tailoring your project descriptions and acquiring key role competencies before applying."}
              </p>
            </div>
          </div>

          {/* 4-Card Multi-Faceted Metric Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-card-top">
                <span className="metric-card-icon">🎯</span>
                <span className="metric-card-value">{matchResult.skill_match_score}%</span>
              </div>
              <span className="metric-card-title">Skill Match Coverage</span>
              <p className="metric-card-desc">
                {matchResult.matched_skills.length} of {matchResult.total_required_skills} target skills detected
              </p>
              <div className="mini-progress-track">
                <div
                  className="mini-progress-fill"
                  style={{ width: `${matchResult.skill_match_score}%`, background: "#34d399" }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <span className="metric-card-icon">🧠</span>
                <span className="metric-card-value">{matchResult.semantic_score}%</span>
              </div>
              <span className="metric-card-title">Semantic Context Relevancy</span>
              <p className="metric-card-desc">
                TF-IDF textual alignment with job description content
              </p>
              <div className="mini-progress-track">
                <div
                  className="mini-progress-fill"
                  style={{ width: `${matchResult.semantic_score}%`, background: "#60a5fa" }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <span className="metric-card-icon">📋</span>
                <span className="metric-card-value">{matchResult.structure_score}%</span>
              </div>
              <span className="metric-card-title">ATS Layout &amp; Structure</span>
              <p className="metric-card-desc">
                Contact information, essential headers, and clean formatting
              </p>
              <div className="mini-progress-track">
                <div
                  className="mini-progress-fill"
                  style={{ width: `${matchResult.structure_score}%`, background: "#a78bfa" }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-top">
                <span className="metric-card-icon">⚡</span>
                <span className="metric-card-value">{matchResult.impact_score}%</span>
              </div>
              <span className="metric-card-title">Impact &amp; Action Verbs</span>
              <p className="metric-card-desc">
                {matchResult.audit?.action_verb_count || 0} active verbs &amp; {matchResult.audit?.quantifiable_metrics_count || 0} quantifiable metrics
              </p>
              <div className="mini-progress-track">
                <div
                  className="mini-progress-fill"
                  style={{ width: `${matchResult.impact_score}%`, background: "#f472b6" }}
                />
              </div>
            </div>
          </div>

          {/* Skill Breakdown with Filter Controls */}
          <div className="skills-breakdown-box">
            <div className="skills-breakdown-header">
              <div className="header-left">
                <h3 className="section-heading">Detailed Skill Gap Matrix</h3>
                <p className="section-subheading">
                  Compare required competencies versus skills found on your resume
                </p>
              </div>

              <div className="filter-pills">
                <button
                  className={`filter-btn ${activeSkillFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveSkillFilter("all")}
                >
                  All ({matchResult.matched_skills.length + matchResult.missing_skills.length})
                </button>
                <button
                  className={`filter-btn matched ${activeSkillFilter === "matched" ? "active" : ""}`}
                  onClick={() => setActiveSkillFilter("matched")}
                >
                  ✓ Matched ({matchResult.matched_skills.length})
                </button>
                <button
                  className={`filter-btn missing ${activeSkillFilter === "missing" ? "active" : ""}`}
                  onClick={() => setActiveSkillFilter("missing")}
                >
                  ⚠ Missing ({matchResult.missing_skills.length})
                </button>
              </div>
            </div>

            {/* Matched Skills */}
            {(activeSkillFilter === "all" || activeSkillFilter === "matched") && (
              <div className="skill-group-container">
                <div className="group-heading matched-heading">
                  <span>✓ Matched Skills ({matchResult.matched_skills.length})</span>
                </div>
                {matchResult.matched_skills.length > 0 ? (
                  <div className="tags-flex">
                    {matchResult.matched_skills.map((s, idx) => (
                      <span key={idx} className="skill-pill matched">
                        <span className="pill-dot matched" />
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-notice">No required skills matched your resume yet.</p>
                )}
              </div>
            )}

            {/* Missing Skills */}
            {(activeSkillFilter === "all" || activeSkillFilter === "missing") && (
              <div className="skill-group-container" style={{ marginTop: 20 }}>
                <div className="group-heading missing-heading">
                  <span>⚠️ Missing Skills to Acquire ({matchResult.missing_skills.length})</span>
                  {matchResult.missing_skills.length > 0 && (
                    <button className="btn-copy-sm" onClick={handleCopyMissing}>
                      📋 Copy Missing Skills
                    </button>
                  )}
                </div>
                {matchResult.missing_skills.length > 0 ? (
                  <div className="tags-flex">
                    {matchResult.missing_skills.map((s, idx) => (
                      <span key={idx} className="skill-pill missing">
                        <span className="pill-dot missing" />
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-notice success">
                    🎉 Excellent! Your resume covers all required skills for this job!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actionable Recommendations Section */}
          {matchResult.recommendations && matchResult.recommendations.length > 0 && (
            <div className="recommendations-box">
              <h3 className="section-heading">🎯 Actionable Resume Optimization Steps</h3>
              <p className="section-subheading">
                Prioritized steps to improve your resume before applying
              </p>

              <div className="recommendations-list">
                {matchResult.recommendations.map((rec, idx) => (
                  <div key={idx} className={`recommendation-item ${rec.type}`}>
                    <div className="rec-icon">
                      {rec.type === "critical" ? "🚨" : rec.type === "warning" ? "⚠️" : "💡"}
                    </div>
                    <div className="rec-body">
                      <h4 className="rec-title">{rec.title}</h4>
                      <p className="rec-text">{rec.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Footer Actions */}
          <div className="results-footer print-hide">
            <button className="btn btn-secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              ↑ Back to Top
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              🖨️ Print / Save PDF Audit Report
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer print-hide">
        <p>
          AI Resume Analyzer &bull; Built with React &amp; Python Flask &bull; Powered by PyMuPDF &amp; NLP
        </p>
      </footer>

      {/* Toast Notification */}
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