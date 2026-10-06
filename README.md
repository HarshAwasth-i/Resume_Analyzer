# 📄 AI Resume Analyzer

An AI-powered Resume Analyzer that evaluates how well a resume matches a given job description using Natural Language Processing (NLP) and Machine Learning techniques.

The application extracts text from a resume, compares it with the provided job description, calculates a resume match score, generates an ATS-style score, identifies missing skills, and visualizes the skill match through an interactive Streamlit dashboard.

---

## 🚀 Features

- 📄 **Resume PDF Upload**
  - Upload a resume in PDF format.
  - Automatically extracts resume text using `pdfplumber`.

- 📝 **Job Description Matching**
  - Paste a target job description.
  - Compares the resume content against the requirements of the role.

- 🎯 **Resume Match Score**
  - Uses TF-IDF vectorization to represent resume and job description text.
  - Calculates similarity using Cosine Similarity.
  - Generates a percentage-based match score.

- 🤖 **ATS Score**
  - Generates an ATS-style score based on resume-job alignment.
  - Provides a quick indication of how well the resume matches the target role.

- 🔍 **Missing Skills Detection**
  - Identifies important technical skills mentioned in the job description.
  - Highlights skills that are required but missing from the resume.

- 📊 **Skill Match Visualization**
  - Visualizes matched and missing skills using charts.
  - Makes it easier to understand resume-job alignment.

- 🎨 **Interactive Streamlit Dashboard**
  - Clean and interactive user interface.
  - Displays all analysis results in one place.

---

## 🛠️ Tech Stack

### Programming Language
- Python

### Framework
- Streamlit

### Machine Learning / NLP
- Scikit-learn
- TF-IDF Vectorization
- Cosine Similarity

### Data Visualization
- Matplotlib

### PDF Processing
- pdfplumber

---

## 🧠 How It Works

The application follows a simple NLP-based resume analysis pipeline:

Resume PDF  
↓  
Text Extraction  
↓  
Resume Text  
↓  
TF-IDF Vectorization  
↓  
Job Description  
↓  
Cosine Similarity  
↓  
Resume Match Score  
↓  
ATS Score + Missing Skills + Skill Visualization

### 1. Resume Upload

The user uploads their resume in PDF format.

The application extracts the text from the uploaded PDF using `pdfplumber`.

### 2. Job Description Input

The user provides the target job description.

The job description acts as the reference against which the resume is evaluated.

### 3. Text Processing

The extracted resume text and job description are processed and converted into numerical representations using **TF-IDF Vectorization**.

### 4. Resume Match Score

The application calculates the similarity between the resume and job description using **Cosine Similarity**.

The similarity value is converted into a percentage to generate the Resume Match Score.

### 5. ATS Score

An ATS-style score is generated based on the resume's alignment with the provided job description.

This provides users with a quick indication of how closely their resume matches the target role.

### 6. Missing Skills Detection

The application checks the skills mentioned in the job description against the skills detected in the resume.

Skills that appear in the job description but are not found in the resume are identified as missing skills.

### 7. Skill Visualization

The application visualizes the skill analysis using charts, making it easier for users to understand their matched and missing skills.

---

## 📊 Analysis Output

After analyzing a resume, the application provides:

- **Resume Match Score**
- **ATS Score**
- **Matched Skills**
- **Missing Skills**
- **Skill Match Visualization**

These results help users understand how closely their resume aligns with a specific job description and identify areas where their resume can be improved.

---

## 📂 Project Structure

    Resume_Analyzer/
    │
    ├── backend/
    │   └── ...
    │
    ├── frontend/
    │   └── ...
    │
    ├── app.py
    ├── jd_matcher.py
    ├── requirements.txt
    ├── .gitignore
    └── README.md

### Important Files

**app.py**

Main Streamlit application responsible for the user interface and overall resume analysis workflow.

**jd_matcher.py**

Contains the core logic for processing resume text, comparing it with the job description, and calculating similarity.

**requirements.txt**

Contains the Python dependencies required to run the application.

---

## ⚙️ Installation

### 1. Clone the Repository

    git clone https://github.com/HarshAwasth-i/Resume_Analyzer.git
    cd Resume_Analyzer

### 2. Create a Virtual Environment

    python -m venv venv

### 3. Activate the Virtual Environment

**Windows**

    venv\Scripts\activate

**macOS / Linux**

    source venv/bin/activate

### 4. Install Dependencies

    pip install -r requirements.txt

### 5. Run the Application

    streamlit run app.py

The application will start locally and Streamlit will provide a URL where the application can be accessed.

---

## 🧪 Usage

1. Launch the Streamlit application.
2. Upload your resume in PDF format.
3. Paste the target job description.
4. Start the resume analysis.
5. Review the Resume Match Score and ATS Score.
6. Check the identified missing skills.
7. Analyze the skill visualization.
8. Use the results to improve your resume according to the target job.

---

## 🧠 Core Concepts

### TF-IDF

**Term Frequency-Inverse Document Frequency (TF-IDF)** is used to convert resume and job description text into numerical vectors.

It assigns importance to words based on their frequency within a document while reducing the importance of words that occur frequently across documents.

### Cosine Similarity

Cosine Similarity measures the similarity between the TF-IDF vectors of the resume and job description.

The similarity value is converted into a percentage:

**Match Score = Cosine Similarity × 100**

A higher score indicates greater textual similarity between the resume and the job description.

### ATS

An **Applicant Tracking System (ATS)** is software commonly used by recruiters to filter and organize job applications.

This project provides an ATS-style score to give users an additional indication of how well their resume aligns with a target job description.

---

## 🎯 Project Goals

The main goal of this project is to demonstrate the practical application of **Natural Language Processing, Machine Learning, and data visualization** to a real-world recruitment problem.

The application helps users:

- Understand resume-job alignment
- Identify potentially missing technical skills
- Get an ATS-style resume score
- Analyze resume compatibility with a target role
- Identify areas where their resume can be improved
- Understand the practical use of text similarity techniques

---

## 🔮 Future Improvements

- 🤖 AI-powered resume improvement suggestions
- 🧠 Advanced NLP-based skill extraction
- 📄 Support for DOCX resumes
- 🎯 Resume analysis for multiple job roles
- 🏆 Resume ranking system
- 📊 More detailed resume analytics
- 📥 Downloadable analysis reports
- 📚 Expanded technical skill database
- 🔐 User authentication
- ☁️ Improved cloud deployment
- ✨ More advanced ATS scoring methodology

---

## 👨‍💻 Author

**Harsh Awasthi**

B.Tech Computer Science Student | Software Development & Machine Learning

---

## ⭐ Support

If you found this project useful or interesting, consider giving the repository a ⭐ on GitHub.
