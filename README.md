# 📄 AI Resume Analyzer

An AI-powered Resume Analyzer that evaluates how well a resume matches a given job description using Natural Language Processing (NLP) and Machine Learning techniques.

The application extracts text from a resume, compares it with the target job description, calculates a multi-faceted ATS match score, identifies missing skills, audits document structure, and provides actionable recommendations.

---

## 🚀 Features

- 📄 **Resume PDF Upload**
  - Upload a resume in PDF format.
  - Automatically extracts resume text with high fidelity using `PyMuPDF` / `pdfplumber`.

- 📝 **Job Description Matching**
  - Paste a target job description or input specific skill sets.
  - Analyzes contextual relevance and keyword alignment.

- 🎯 **Multi-Faceted ATS Match Score**
  - Uses TF-IDF vectorization and Cosine Similarity to compute semantic similarity.
  - Generates a composite score based on skill coverage, semantic alignment, and structure.

- 🔍 **Missing Skills Detection**
  - Identifies important technical skills mentioned in the job description across 7 categories.
  - Highlights skills that are required but missing from the resume.

- 📋 **Resume Structure & Formatting Audit**
  - Checks for essential contact information (Email, Phone, LinkedIn, GitHub).
  - Validates key sections (Experience, Education, Skills, Projects, Summary).
  - Analyzes action verbs and quantifiable impact metrics.

- 🖨️ **Print & PDF Audit Export**
  - Clean printable audit view to save or print the ATS evaluation report.

- 🎨 **Dual Interface Support**
  - **Modern React & Flask Web Dashboard**: Clean slate dark-mode UI with skill breakdown and recommendations.
  - **Interactive Streamlit App**: Standalone rapid evaluation interface.

---

## 🛠️ Tech Stack

### Web Application (React + Flask)
- **Frontend**: React, Modern Vanilla CSS, Responsive Layout
- **Backend**: Python, Flask, Flask-CORS, PyMuPDF (`fitz`)

### Prototype (Streamlit)
- **Framework**: Streamlit
- **ML / NLP**: Scikit-learn, TF-IDF Vectorization, Cosine Similarity
- **Data Visualization**: Matplotlib
- **PDF Processing**: pdfplumber

---

## 📂 Project Structure

```
Resume_Analyzer/
├── backend/                  # Flask REST API
│   ├── app.py                # NLP parser, skill taxonomy, audit engine, & TF-IDF similarity
│   └── venv/                 # Python virtual environment
├── frontend/                 # Modern React UI
│   ├── public/               # Static assets & HTML template
│   └── src/
│       ├── App.js            # Main dashboard component
│       ├── App.css           # Clean dark-mode styles & print stylesheets
│       └── index.css         # Typography & design tokens
├── app.py                    # Streamlit application
├── jd_matcher.py             # TF-IDF calculation utility
├── requirements.txt          # Python dependencies
├── package.json              # Root npm script runner
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Running

### 1. Clone the Repository

```bash
git clone https://github.com/HarshAwasth-i/Resume_Analyzer.git
cd Resume_Analyzer
```

### 2. Option A: Run the React + Flask Web App

#### Start the Flask Backend (Terminal 1):
```bash
cd backend
.\venv\Scripts\python.exe app.py
```
*Backend runs on `http://127.0.0.1:5000`*

#### Start the React Frontend (Terminal 2):
```bash
npm start
```
*Frontend runs on `http://localhost:3001`*

### 3. Option B: Run the Streamlit Prototype

```bash
pip install -r requirements.txt
streamlit run app.py
```

---

## 📡 API Endpoints (Flask Backend)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status check |
| `POST` | `/upload` | Parses PDF resume, extracts skills & audits document structure |
| `POST` | `/match` | Calculates composite ATS score, skill coverage, & generates recommendations |

---

## 👨‍💻 Author

**Harsh Awasthi**

B.Tech Computer Science Student | Software Development & Machine Learning

---

## ⭐ Support

If you found this project useful, consider giving the repository a ⭐ on GitHub.
