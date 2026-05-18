import streamlit as st
import matplotlib.pyplot as plt
from jd_matcher import extract_text_from_pdf, calculate_match

# Page Config
st.set_page_config(
    page_title="AI Resume Analyzer",
    page_icon="📄",
    layout="centered"
)

# Custom CSS
st.markdown(
    """
    <style>

    .main {
        background-color: #0E1117;
    }

    h1 {
        color: white;
        text-align: center;
    }

    .stButton button {
        width: 100%;
        border-radius: 10px;
        height: 3em;
        font-size: 18px;
    }

    </style>
    """,
    unsafe_allow_html=True
)

# Title
st.markdown(
    "<h1>📄 AI Resume Analyzer</h1>",
    unsafe_allow_html=True
)

# Upload Resume
uploaded_file = st.file_uploader(
    "Upload Your Resume (PDF)",
    type=["pdf"]
)

# Paste Job Description
job_description = st.text_area(
    "Paste Job Description"
)

# Analyze Button
if st.button("Analyze Resume"):

    if uploaded_file is not None and job_description:

        # Save uploaded PDF temporarily
        with open("temp_resume.pdf", "wb") as f:
            f.write(uploaded_file.read())

        # Extract Resume Text
        resume_text = extract_text_from_pdf(
            "temp_resume.pdf"
        )

        # Calculate Match Score
        score = calculate_match(
            resume_text,
            job_description
        )

        # Display Match Score
        st.subheader(
            f"Resume Match Score: {score}%"
        )

        # ATS Score
        ats_score = min(score + 15, 100)

        st.progress(int(ats_score))

        st.success(f"ATS Score: {ats_score}%")

        # Skills List
        common_skills = [
            "Python",
            "Java",
            "C++",
            "Machine Learning",
            "SQL",
            "Data Structures",
            "Algorithms",
            "React",
            "Node.js",
            "MongoDB",
            "Deep Learning",
            "NLP"
        ]

        # Missing Skills Detection
        missing_skills = []

        for skill in common_skills:

            if skill.lower() in job_description.lower():

                if skill.lower() not in resume_text.lower():

                    missing_skills.append(skill)

        # Display Missing Skills
        if missing_skills:

            st.warning("Missing Skills Detected")

            for skill in missing_skills:

                st.write(f"• {skill}")

        else:

            st.success("No Major Skills Missing")

        # Skill Visualization Chart
        matched_skills = len(common_skills) - len(missing_skills)

        labels = ["Matched Skills", "Missing Skills"]

        sizes = [matched_skills, len(missing_skills)]

        fig, ax = plt.subplots()

        ax.pie(
            sizes,
            labels=labels,
            autopct='%1.1f%%'
        )

        ax.axis('equal')

        st.subheader("Skill Match Analysis")

        st.pyplot(fig)

    else:

        st.error("Please upload a resume and paste a job description.")