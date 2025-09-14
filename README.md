# Smart Licensing Assistant

## Project Description
The Smart Licensing Assistant is an AI-powered tool that helps Israeli small business owners understand and comply with legal regulations. It extracts text from PDF files, summarizes legal paragraphs in actionable Hebrew, categorizes rules by business services (e.g., בשר, משלוחים), and outputs structured JSON for easy use in a frontend application.

### Goals
- Extract and process text from PDFs
- Summarize regulations clearly in Hebrew
- Categorize rules by business conditions (serves_meat, deliveries)
- Provide structured output for integration with frontend apps
- Use AI for semantic processing to save time and reduce complexity

## File Structure

biz-licensing/
├─ backend/
│  ├─ process_pdf.py
│  ├─ data/
│  │  └─ processed_rules.json
│  ├─ .env
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  └─ index.css
│  ├─ package.json
│  └─ vite.config.js
├─ README.md


## Quick Start / Installation

### Backend
git clone <repository-url>
cd biz-licensing/backend
pip install PyMuPDF openai python-dotenv

Create a .env file with your OpenAI key:
OPENAI_API_KEY=your_openai_api_key

Run the PDF processor:
python process_pdf.py

Output JSON will be saved at:
data/processed_rules.json

### Frontend
cd ../frontend
npm install
npm run dev

Open the browser at:
http://localhost:5173

### Dependencies & Versions

Backend (Python)

| Package       | Version |
| ------------- | ------- |
| PyMuPDF       | 1.26.4  |
| openai        | 1.107.2 |
| python-dotenv | 0.21.0  |


Frontend (React + Vite)

| Package      | Version |
| ------------ | ------- |
| React        | 18.3.1  |
| Vite         | latest  |
| TailwindCSS  | latest  |
| lucide-react | 0.544.0 |
| Axios        | 1.4.0   |


### Technical Documentation

## System Architecture

- Backend: PDF processing, OpenAI integration, Node.js, Express
- Frontend: React + Vite + Tailwind
- Data flow: PDF → Backend → JSON → Frontend display

## API Documentation

### 1. GET /
**Description:** Default route to check if the server is running.  
**URL:** `/`  
**Method:** GET  

### 2. POST /api/match
**Description:** Returns all licensing rules that match the given business conditions.  
**URL:** `/api/match`  
**Method:** POST  

### 3. POST /api/generate-report
**Description:** Generates a licensing report in Hebrew. Uses OpenAI if available; otherwise uses a fallback report.  
**URL:** `/api/generate-report`  
**Method:** POST  


## Data Structure
JSON schema output from process_pdf.py:
{
  "source_file": "18-07-2022_4.2A.pdf",
  "rules_found": [
    {
      "id": "1_0",
      "title": "בשר",
      "category": "בשר",
      "page": 1,
      "obligation": "...",
      "conditions": {
        "serves_meat": true,
        "deliveries": false
      },
      "priority": 1
    }
  ]
}


## Matching Algorithm
Paragraphs are split from PDFs → sent to LLM → categorized by business type → conditions detected → JSON structured output

## AI Usage Documentation

### Development Tools
Python openai package for LLM calls
PyMuPDF for PDF text extraction

### Central Language Model
Model: gpt-4o-mini
Reason: Concise Hebrew summarization, semantic understanding, cost-effective

#### Prompts
prompt sent to LLM:
You are a regulatory assistant for Israeli businesses.
Rewrite the following legal paragraph in concise, clear, actionable Hebrew for a small business owner.
Also, determine category (בשר, משלוחים) 
Paragraph: {para}
Return JSON like:
{
  "summary": "...",
  "category": "...",
  "conditions": { "serves_meat": true/false, "deliveries": true/false }
}

## Learning and Improvements

### Development Log
Challenges: Handling OpenAI API updates, PDF extraction edge cases, semantic parsing of Hebrew legal text
Solutions: Migrated to latest openai SDK, added retry logic, structured prompt for JSON output

### Future Improvements
- Support more document formats 
- Add caching to reduce repeated OpenAI calls
- Better error handling for invalid PDF content

### Lessons Learned
- LLMs can summarize legal text effectively, but structured prompts are critical
- Environment variables are essential for API security
- Combining Python backend and React frontend allows seamless processing and display