import os
import re
import math
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# -------------------------------------------------------------
# Curated Skills Taxonomy with Categories
# -------------------------------------------------------------
SKILL_TAXONOMY = {
    "Languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "sql", "html", "html5", "css",
        "css3", "bash", "shell", "r", "scala", "dart"
    ],
    "Frameworks & Web": [
        "react", "react.js", "react native", "next.js", "nextjs", "vue", "vue.js",
        "angular", "node", "node.js", "nodejs", "express", "express.js", "django",
        "flask", "fastapi", "spring boot", "spring", "asp.net", ".net",
        "ruby on rails", "rails", "tailwind css", "tailwind", "bootstrap",
        "redux", "graphql", "jquery", "svelte"
    ],
    "Databases": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
        "oracle", "cassandra", "elasticsearch", "dynamodb", "firebase",
        "supabase", "mariadb", "neo4j"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "google cloud", "gcp",
        "docker", "kubernetes", "k8s", "ci/cd", "ci cd", "git", "github",
        "gitlab", "linux", "terraform", "ansible", "nginx", "jenkins",
        "helm", "prometheus", "grafana"
    ],
    "AI & Data Science": [
        "machine learning", "deep learning", "nlp", "natural language processing",
        "computer vision", "pytorch", "tensorflow", "scikit-learn", "sklearn",
        "pandas", "numpy", "keras", "hugging face", "llms", "large language models",
        "generative ai", "data analysis", "power bi", "tableau", "matplotlib",
        "seaborn", "opencv", "langchain"
    ],
    "Tools & Architecture": [
        "rest api", "restful api", "apis", "api", "microservices", "system design",
        "agile", "scrum", "jira", "unit testing", "jest", "cypress", "websockets",
        "kafka", "rabbitmq", "celery", "postman", "webpack", "vite"
    ],
    "Soft Skills": [
        "leadership", "communication", "problem solving", "teamwork",
        "project management", "critical thinking", "mentorship", "collaboration",
        "adaptability", "time management"
    ]
}

# Mapping from lowercase skill alias to canonical name & category
SKILL_LOOKUP = {}
CANONICAL_NAMES = {
    "c++": "C++",
    "c#": "C#",
    ".net": ".NET",
    "react.js": "React",
    "react": "React",
    "react native": "React Native",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue.js": "Vue.js",
    "vue": "Vue.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node": "Node.js",
    "express.js": "Express.js",
    "express": "Express.js",
    "html5": "HTML5",
    "html": "HTML",
    "css3": "CSS3",
    "css": "CSS",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "python": "Python",
    "java": "Java",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "oracle": "Oracle",
    "elasticsearch": "Elasticsearch",
    "dynamodb": "DynamoDB",
    "firebase": "Firebase",
    "supabase": "Supabase",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud (GCP)",
    "google cloud": "Google Cloud (GCP)",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "ci/cd": "CI/CD",
    "ci cd": "CI/CD",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "linux": "Linux",
    "terraform": "Terraform",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "natural language processing": "Natural Language Processing",
    "computer vision": "Computer Vision",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "llms": "LLMs",
    "large language models": "LLMs",
    "generative ai": "Generative AI",
    "power bi": "Power BI",
    "tableau": "Tableau",
    "rest api": "REST APIs",
    "restful api": "REST APIs",
    "api": "REST APIs",
    "apis": "REST APIs",
    "microservices": "Microservices",
    "system design": "System Design",
    "agile": "Agile",
    "scrum": "Scrum",
    "unit testing": "Unit Testing",
    "leadership": "Leadership",
    "communication": "Communication",
    "problem solving": "Problem Solving",
    "project management": "Project Management",
    "teamwork": "Teamwork"
}

for cat, skills in SKILL_TAXONOMY.items():
    for skill in skills:
        canon = CANONICAL_NAMES.get(skill, skill.title())
        SKILL_LOOKUP[skill.lower()] = {"name": canon, "category": cat}

# Sort skill search terms longest-first to match multi-word phrases before single tokens
ALL_SEARCH_TERMS = sorted(SKILL_LOOKUP.keys(), key=lambda x: len(x), reverse=True)

# Common action verbs for resume impact analysis
ACTION_VERBS = {
    "accelerated", "achieved", "administered", "analyzed", "architected", "automated",
    "built", "championed", "collaborated", "constructed", "created", "decreased",
    "delivered", "deployed", "designed", "developed", "devised", "directed",
    "engineered", "established", "executed", "expanded", "formulated", "generated",
    "guided", "implemented", "improved", "increased", "initiated", "innovated",
    "integrated", "introduced", "launched", "lead", "led", "managed", "maximized",
    "mentored", "migrated", "minimized", "modeled", "modernized", "negotiated",
    "optimized", "orchestrated", "organized", "overhauled", "pioneered", "planned",
    "produced", "programmed", "redesigned", "reduced", "refactored", "resolved",
    "restructured", "scaled", "simplified", "spearheaded", "streamlined", "supervised",
    "trained", "transformed", "upgraded"
}

# -------------------------------------------------------------
# Helper Functions: PDF, Text, and Skill Extraction
# -------------------------------------------------------------
def extract_text_from_pdf(file_stream):
    """Extract clean text from PDF bytes using PyMuPDF."""
    text = ""
    try:
        pdf = fitz.open(stream=file_stream.read(), filetype="pdf")
        for page in pdf:
            text += page.get_text() + "\n"
    except Exception as e:
        print(f"Error parsing PDF: {e}")
    return text.strip()

def extract_skills_with_categories(text):
    """
    Extract skills using phrase matching and word boundaries.
    Returns:
        dict: {
            "skills": [canonical_name, ...],
            "categorized": { category: [canonical_name, ...] },
            "count": int
        }
    """
    if not text:
        return {"skills": [], "categorized": {}, "count": 0}

    # Normalize text for matching
    cleaned = text.lower()
    found_skills_map = {}  # canonical_name -> category

    for term in ALL_SEARCH_TERMS:
        info = SKILL_LOOKUP[term]
        canonical = info["name"]

        # Check if already found
        if canonical in found_skills_map:
            continue

        # Pattern for special terms vs standard words
        if term in ["c++", "c#", ".net"]:
            pattern = re.escape(term)
        elif "/" in term or "-" in term or "." in term:
            pattern = r'(?:\b|(?<=\s))' + re.escape(term) + r'(?:\b|(?=\s))'
        else:
            pattern = r'\b' + re.escape(term) + r'\b'

        if re.search(pattern, cleaned):
            found_skills_map[canonical] = info["category"]

    # Group into categories
    categorized = {}
    for canon, cat in found_skills_map.items():
        if cat not in categorized:
            categorized[cat] = []
        categorized[cat].append(canon)

    # Sort skills within each category
    for cat in categorized:
        categorized[cat].sort()

    return {
        "skills": sorted(list(found_skills_map.keys())),
        "categorized": categorized,
        "count": len(found_skills_map)
    }

# -------------------------------------------------------------
# Resume Audit: Contact Info, Sections, and Action Verbs
# -------------------------------------------------------------
def audit_resume_content(text):
    """
    Audit resume structure, contact information, sections,
    action verbs, and measurable impact.
    """
    lower_text = text.lower()

    # 1. Contact Information
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    linkedin_match = re.search(r'linkedin\.com/in/[a-zA-Z0-9_-]+', lower_text)
    github_match = re.search(r'github\.com/[a-zA-Z0-9_-]+', lower_text)

    contact_info = {
        "has_email": bool(email_match),
        "email": email_match.group(0) if email_match else None,
        "has_phone": bool(phone_match),
        "phone": phone_match.group(0) if phone_match else None,
        "has_linkedin": bool(linkedin_match),
        "has_github": bool(github_match)
    }

    # 2. Section Detection
    sections = {
        "experience": bool(re.search(r'\b(experience|work history|employment|career history)\b', lower_text)),
        "education": bool(re.search(r'\b(education|academic|qualifications|degree|university)\b', lower_text)),
        "skills": bool(re.search(r'\b(skills|technical skills|technologies|competencies)\b', lower_text)),
        "projects": bool(re.search(r'\b(projects|key projects|personal projects|portfolio)\b', lower_text)),
        "summary": bool(re.search(r'\b(summary|objective|professional summary|about me|profile)\b', lower_text)),
        "certifications": bool(re.search(r'\b(certifications|certificates|licenses|achievements)\b', lower_text))
    }

    # 3. Action Verbs Detection
    words = re.findall(r'\b[a-zA-Z]+\b', lower_text)
    found_action_verbs = list(set(word for word in words if word in ACTION_VERBS))

    # 4. Quantifiable Metrics Detection (numbers, percentages, currencies)
    metrics_matches = re.findall(r'(?:\$\d+(?:,\d+)*(?:\.\d+)?|\d+%\b|\b\d+\+\b|\b\d+(?:,\d+)*\s*(?:users|clients|requests|downloads|x|k|m|million|billion)\b)', text, re.IGNORECASE)

    # 5. Word Count & Reading Time
    word_count = len(words)
    estimated_read_time_min = round(word_count / 200, 1)

    # Section health score (0 - 100)
    section_score = 0
    if contact_info["has_email"]: section_score += 15
    if contact_info["has_phone"]: section_score += 10
    if contact_info["has_linkedin"] or contact_info["has_github"]: section_score += 10
    if sections["experience"]: section_score += 20
    if sections["skills"]: section_score += 15
    if sections["education"]: section_score += 15
    if sections["projects"]: section_score += 10
    if sections["summary"]: section_score += 5
    structure_score = min(100, section_score)

    # Impact Score (0 - 100)
    impact_score = 0
    # Verbs score (up to 40)
    impact_score += min(40, len(found_action_verbs) * 4)
    # Metrics score (up to 35)
    impact_score += min(35, len(metrics_matches) * 7)
    # Length score (up to 25)
    if 350 <= word_count <= 950:
        impact_score += 25
    elif 250 <= word_count <= 1200:
        impact_score += 15
    else:
        impact_score += 5
    impact_score = min(100, impact_score)

    return {
        "contact_info": contact_info,
        "sections": sections,
        "action_verbs": sorted(found_action_verbs),
        "action_verb_count": len(found_action_verbs),
        "quantifiable_metrics_count": len(metrics_matches),
        "sample_metrics": metrics_matches[:5],
        "word_count": word_count,
        "estimated_read_time_min": estimated_read_time_min,
        "structure_score": structure_score,
        "impact_score": impact_score
    }

# -------------------------------------------------------------
# TF-IDF & Cosine Similarity in Pure Python (Zero external deps)
# -------------------------------------------------------------
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
    "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than",
    "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
    "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what",
    "what's", "when", "when's", "where", "where's", "which", "while", "who",
    "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you",
    "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
}

def tokenize_clean(text):
    """Tokenize and remove punctuation/stopwords."""
    tokens = re.findall(r'\b[a-zA-Z0-9_+#.-]+\b', text.lower())
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]

def calculate_tfidf_similarity(doc1, doc2):
    """Calculate TF-IDF Cosine Similarity between two documents (0 to 100%)."""
    if not doc1 or not doc2:
        return 0.0

    tokens1 = tokenize_clean(doc1)
    tokens2 = tokenize_clean(doc2)

    if not tokens1 or not tokens2:
        return 0.0

    tf1 = Counter(tokens1)
    tf2 = Counter(tokens2)
    vocabulary = set(tf1.keys()).union(set(tf2.keys()))

    # Document frequency
    doc_freq = {word: (1 if word in tf1 else 0) + (1 if word in tf2 else 0) for word in vocabulary}
    num_docs = 2

    # TF-IDF vectors
    vec1, vec2 = {}, {}
    for word in vocabulary:
        idf = math.log((num_docs + 1) / (doc_freq[word] + 1)) + 1.0
        vec1[word] = (tf1.get(word, 0) / len(tokens1)) * idf
        vec2[word] = (tf2.get(word, 0) / len(tokens2)) * idf

    # Cosine Similarity
    dot_product = sum(vec1[w] * vec2[w] for w in vocabulary)
    mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

    if mag1 == 0 or mag2 == 0:
        return 0.0

    score = (dot_product / (mag1 * mag2)) * 100
    # Rescale realistic TF-IDF range (typically 0.15 - 0.70) to human expected 0 - 100
    normalized_score = min(100.0, round(score * 1.6, 1))
    return normalized_score

# -------------------------------------------------------------
# Actionable Recommendations Engine
# -------------------------------------------------------------
def generate_recommendations(missing_skills, audit, skill_score, semantic_score):
    """Generate prioritized, actionable advice."""
    recommendations = []

    # High Priority: Missing Skills
    if missing_skills:
        top_missing = missing_skills[:4]
        recommendations.append({
            "type": "critical",
            "title": f"Add High-Priority Skills ({len(missing_skills)} missing)",
            "message": f"Your resume lacks mentions of key job requirements: {', '.join(top_missing)}. Adding these in your Skills or Experience section will immediately raise your ATS keyword score."
        })

    # High Priority: Essential Sections
    missing_sections = []
    if not audit["sections"]["experience"]: missing_sections.append("Work Experience")
    if not audit["sections"]["projects"]: missing_sections.append("Projects")
    if not audit["sections"]["skills"]: missing_sections.append("Skills")
    if not audit["sections"]["education"]: missing_sections.append("Education")

    if missing_sections:
        recommendations.append({
            "type": "critical",
            "title": "Missing Standard ATS Sections",
            "message": f"ATS parsers look for clear section headers. Add dedicated headers for: {', '.join(missing_sections)}."
        })

    # Medium Priority: Contact Info
    missing_contact = []
    if not audit["contact_info"]["has_email"]: missing_contact.append("Email Address")
    if not audit["contact_info"]["has_phone"]: missing_contact.append("Phone Number")
    if not audit["contact_info"]["has_linkedin"]: missing_contact.append("LinkedIn Profile")
    if not audit["contact_info"]["has_github"]: missing_contact.append("GitHub / Portfolio")

    if missing_contact:
        recommendations.append({
            "type": "warning",
            "title": "Complete Contact & Online Presence",
            "message": f"Boost recruiter engagement by including: {', '.join(missing_contact)}."
        })

    # Medium Priority: Quantifiable Metrics
    if audit["quantifiable_metrics_count"] < 3:
        recommendations.append({
            "type": "warning",
            "title": "Quantify Achievements with Numbers",
            "message": "Only " + str(audit["quantifiable_metrics_count"]) + " metric(s) found. High-impact resumes use numbers to prove results (e.g. 'Increased performance by 35%', 'Reduced latency by 120ms', 'Managed $50k budget')."
        })

    # Low Priority / Tips: Action Verbs & Word Count
    if audit["action_verb_count"] < 6:
        recommendations.append({
            "type": "tip",
            "title": "Strengthen Bullet Points with Dynamic Action Verbs",
            "message": "Begin bullet points with powerful action verbs like 'Architected', 'Spearheaded', 'Optimized', or 'Automated' to demonstrate ownership."
        })

    if audit["word_count"] < 300:
        recommendations.append({
            "type": "tip",
            "title": "Resume May Be Too Brief",
            "message": f"Current word count is {audit['word_count']} words. A 1-page technical resume typically contains 400-800 words to provide adequate depth."
        })
    elif audit["word_count"] > 1100:
        recommendations.append({
            "type": "tip",
            "title": "Consider Trimming for Conciseness",
            "message": f"Current word count is {audit['word_count']} words. Ensure your resume stays focused and avoid cluttering with non-essential details."
        })

    return recommendations

# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------
@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "service": "AI Resume Analyzer API",
        "version": "2.0.0",
        "endpoints": ["/upload", "/match"]
    })

@app.route('/upload', methods=['POST'])
def upload_resume():
    """
    Receives PDF resume file, extracts text, identifies skills,
    and runs comprehensive structural ATS audit.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    text = extract_text_from_pdf(file)
    if not text:
        return jsonify({"error": "Unable to extract text from PDF. The document may be scanned or empty."}), 422

    skill_data = extract_skills_with_categories(text)
    audit = audit_resume_content(text)

    return jsonify({
        "message": "Resume analyzed successfully",
        "skills": skill_data["skills"],
        "categorized_skills": skill_data["categorized"],
        "skill_count": skill_data["count"],
        "audit": audit,
        "preview_text": text[:600],
        "full_text": text
    })

@app.route('/match', methods=['POST'])
def match_resume():
    """
    Compares resume against job requirements.
    Supports either:
    - `job_description`: full job posting text (auto-extracts skills + semantic similarity)
    - `job_skills`: array of skill strings
    - `resume_text` and `resume_skills`: passed from upload or client state
    """
    data = request.json or {}

    resume_text = data.get("resume_text", "")
    resume_skills_input = data.get("resume_skills", [])
    job_description = data.get("job_description", "")
    job_skills_input = data.get("job_skills", [])

    # Canonicalize resume skills
    resume_skills_set = set()
    for s in resume_skills_input:
        canon = SKILL_LOOKUP.get(s.strip().lower(), {}).get("name", s.strip().title())
        resume_skills_set.add(canon)

    # Determine job required skills: from raw text and/or explicit list
    job_skills_set = set()
    if job_description.strip():
        extracted_job = extract_skills_with_categories(job_description)
        for s in extracted_job["skills"]:
            job_skills_set.add(s)

    for s in job_skills_input:
        if s.strip():
            canon = SKILL_LOOKUP.get(s.strip().lower(), {}).get("name", s.strip().title())
            job_skills_set.add(canon)

    # Fallback if no specific skills found from text or list
    if not job_skills_set and job_description.strip():
        tokens = tokenize_clean(job_description)
        top_terms = [word.title() for word, count in Counter(tokens).most_common(10) if len(word) > 2]
        job_skills_set = set(top_terms)

    # Matched and missing skills
    matched = sorted(list(resume_skills_set & job_skills_set))
    missing = sorted(list(job_skills_set - resume_skills_set))

    # Skill match score (0 - 100)
    skill_score = 0.0
    if job_skills_set:
        skill_score = round((len(matched) / len(job_skills_set)) * 100, 1)

    # Semantic TF-IDF similarity (0 - 100)
    semantic_score = 0.0
    if resume_text and job_description:
        semantic_score = calculate_tfidf_similarity(resume_text, job_description)
    else:
        semantic_score = skill_score

    # Audit resume structure
    audit = audit_resume_content(resume_text) if resume_text else {
        "structure_score": 75,
        "impact_score": 70,
        "sections": {},
        "contact_info": {},
        "action_verb_count": 0,
        "quantifiable_metrics_count": 0,
        "word_count": 0,
        "action_verbs": []
    }

    # Composite ATS Score
    # 40% Skill Match, 25% Semantic Relevancy, 20% Structure, 15% Content Impact
    composite = round(
        (0.40 * skill_score) +
        (0.25 * semantic_score) +
        (0.20 * audit["structure_score"]) +
        (0.15 * audit["impact_score"]),
        1
    )

    # Categorize matched and missing skills
    matched_categorized = {}
    for s in matched:
        cat = SKILL_LOOKUP.get(s.lower(), {}).get("category", "General Skills")
        matched_categorized.setdefault(cat, []).append(s)

    missing_categorized = {}
    for s in missing:
        cat = SKILL_LOOKUP.get(s.lower(), {}).get("category", "General Skills")
        missing_categorized.setdefault(cat, []).append(s)

    # Generate recommendations
    recommendations = generate_recommendations(
        missing, audit, skill_score, semantic_score
    )

    return jsonify({
        "composite_score": composite,
        "skill_match_score": skill_score,
        "semantic_score": semantic_score,
        "structure_score": audit["structure_score"],
        "impact_score": audit["impact_score"],
        "matched_skills": matched,
        "matched_categorized": matched_categorized,
        "missing_skills": missing,
        "missing_categorized": missing_categorized,
        "total_required_skills": len(job_skills_set),
        "audit": audit,
        "recommendations": recommendations
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 AI Resume Analyzer Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)