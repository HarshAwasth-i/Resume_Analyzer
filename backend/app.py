from flask_cors import CORS
from flask import Flask, request, jsonify
import fitz  

import spacy

nlp = spacy.load("en_core_web_sm")

app = Flask(__name__)
CORS(app)

def extract_text_from_pdf(file):
    text = ""
    pdf = fitz.open(stream=file.read(), filetype="pdf")
    for page in pdf:
        text += page.get_text()
    return text

def extract_skills(text):
    skill_list = [
    "python", "java", "c++", "sql", "mysql",
    "machine learning", "deep learning",
    "react", "node", "mongodb",
    "html", "css", "javascript",
    "api", "flask"
]
    
    doc = nlp(text.lower())
    found_skills = []

    for token in doc:
        if token.text in skill_list:
            found_skills.append(token.text)

    return list(set(found_skills))    

@app.route('/')
def home():
    return "Resume Analyzer Backend Running 🚀"

@app.route('/upload', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"})
    
    file = request.files['file']
    text = extract_text_from_pdf(file)
    skills = extract_skills(text)
    
    return jsonify({
    "message": "Resume processed",
    "skills": skills,
    "preview_text": text[:300]
})

@app.route('/match', methods=['POST'])

def match_resume():
    data = request.json

    resume_skills = [s.strip().lower() for s in data.get("resume_skills", [])]
    job_skills = [s.strip().lower() for s in data.get("job_skills", [])]

    matched = list(set(resume_skills) & set(job_skills))
    missing = list(set(job_skills) - set(resume_skills))

    score = (len(matched) / len(job_skills)) * 100 if job_skills else 0

    return jsonify({
        "match_score": round(score, 2),
        "matched_skills": matched,
        "missing_skills": missing
    })

if __name__ == '__main__':
    app.run(debug=True)