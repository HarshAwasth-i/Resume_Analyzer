import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  const [jobSkills, setJobSkills] = useState("");
  const [matchResult, setMatchResult] = useState(null);

 const handleUpload = async () => {
  if (!file) {
    alert("Please upload a resume first");
    return;
  }
  setLoading(true);

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://127.0.0.1:5000/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  setSkills(data.skills);

  setLoading(false);
};


const handleMatch = async () => {
   if (!jobSkills) {
    alert("Enter job skills");
    return;
  }

  setLoading(true);
  const jobSkillsArray = jobSkills.split(",").map(s => s.trim());

  const res = await fetch("http://127.0.0.1:5000/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      resume_skills: skills,
      job_skills: jobSkillsArray
    })
  });

  const data = await res.json();
  setMatchResult(data);

  setLoading(false);
};

  return (
  <div style={{
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }}>

    <div style={{
      width: "500px",
      background: "white",
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>

      <h1 style={{ textAlign: "center" }}>Resume Analyzer </h1>

      {/* Upload */}
      <div style={{ marginBottom: "15px" }}>
  <input
    type="file"
    id="fileUpload"
    onChange={(e) => setFile(e.target.files[0])}
    style={{ display: "none" }}
  />

  <label
    htmlFor="fileUpload"
    style={{
      padding: "8px 15px",
      backgroundColor: "#e2e8f0",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "10px"
    }}
  >
    Choose File
  </label>

  <span style={{ color: "#555" }}>
    {file ? file.name : "No file chosen"}
  </span>
</div>
      <br /><br />

      <button 
        onClick={handleUpload}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Upload Resume
      </button>

      {/* Skills */}
      <h2>Skills:</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {skills.map((skill, index) => (
          <span key={index} style={{
            background: "#e0e7ff",
            padding: "5px 10px",
            borderRadius: "20px"
          }}>
            {skill}
          </span>
        ))}
      </div>

      {/* Job Skills */}
      <h2 style={{ marginTop: "20px" }}>Job Skills</h2>
      <input
        type="text"
        value={jobSkills}
        onChange={(e) => setJobSkills(e.target.value)}
        placeholder="python, sql, react"
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc"
        }}
      />

      <br /><br />

      <button 
        onClick={handleMatch}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Check Match
      </button>

      {/* Result */}
     {matchResult && (
  <div style={{
    marginTop: "20px",
    padding: "15px",
    background: "#eef2ff",
    borderRadius: "10px",
    textAlign: "center"
  }}>
    <h2>Match Score: {matchResult.match_score}%</h2>

    <p><b>Matched Skills:</b></p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
      {matchResult.matched_skills.map((s, i) => (
        <span key={i} style={{ background: "#d1fae5", padding: "5px 10px", borderRadius: "20px" }}>
          {s}
        </span>
      ))}
    </div>

    <p style={{ marginTop: "10px" }}><b>Missing Skills:</b></p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
      {matchResult.missing_skills.map((s, i) => (
        <span key={i} style={{ background: "#fee2e2", padding: "5px 10px", borderRadius: "20px" }}>
          {s}
        </span>
      ))}
    </div>
  </div>
)}

    </div>
  </div>
);
}

export default App;