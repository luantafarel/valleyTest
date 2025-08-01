# Valley Backend Task

A clean, simplified Node.js backend focused on AI-powered sales sequence generation.

## What This Project Does

This is my take on the Valley Backend Engineer Task. The goal was to build a system that generates personalized sales sequences using AI, with smart prospect analysis based on LinkedIn URLs.

## Quick Start

```bash
# Install dependencies
npm install

# Add your OpenAI API key (optional - works with mock data without it)
echo "GEMINI_API_KEY=sk-your-key" > .env

# Start the server
npm run dev

# Test it out
curl -X POST http://localhost:3000/api/ai/generate-sequence \
  -H "Content-Type: application/json" \
  -d '{"prospect_url": "https://www.linkedin.com/in/vitor-assis-4b5338116/","tov_config": {"formality": 0.5,"warmth": 1, "directness": 0.1}, "company_context": "We help SaaS companies automate sales", "sequence_length": 3 }'
```

## Why There Are No Postgres

Originally, I implemented a full PostgreSQL integration with JSONB support for caching AI responses. The idea was: store request parameters (prospect URL, tone configuration, company context) as JSONB and cache the API responses to avoid unnecessary calls to OpenAI.

**What I built:**
- PostgreSQL with JSONB columns for flexible data storage
- Graceful fallback when database was unavailable
- Docker Compose setup with proper healthchecks

**Why I removed it:**
The caching feature, while good, added too many issues with deployment to Railway. The mock AI responses are fast enough, and in a real production environment. 
Another good approach to the project would be storing interactions, and keeping them, but since the only endpoint at this point is to gather messages it felt unnecessary.

This project now focuses on: clean AI integration, smart name parsing, and reliable API responses.

## API Endpoints

### `GET /health`
Simple health check
```json
{"status": "OK"}
```

### `POST /api/ai/generate-sequence`
Generate personalized sales sequences

**Request:**
```json
{
  "prospect_url": "https://linkedin.com/in/luan-tafarel",
  "tov_config": {"formality": 0.8, "warmth": 0.6, "directness": 0.7},
  "company_context": "We help SaaS companies automate sales",
  "sequence_length": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": ["Hi Luan Tafarel, I came across your profile..."],
    "thinking_process": "Generated 3 personalized messages for Luan Tafarel...",
    "confidence_scores": {"overall": 0.75, "personalization": 0.70, "tone": 0.80},
    "prospect_analysis": {
      "name": "Luan Tafarel",
      "role": "Professional", 
      "company": "LinkedIn Company",
      "insights": ["Profile suggests SaaS experience"]
    }
  }
}
```



## Problems faced

During the deployment I have faced many issues, to begin i have started using OpenAi but since i had to pay to use i scratched that and searched for free ai to use, until i reached Gemini. Then i have faced another issue.
For some reason the ai was never visiting the url, which meant that it never really created a personalized message, it fell for some fall backs or asked me to fill fields, thats not what i wanted so i have created a basic scrapper that went to the prospect_url, filled some fields like name, title, location and company and that allowed me to move forward with the development. Last, but not least, deploying it to Railway, thats something i never did. Given those scenarios and the explanations given i opted into not including security to this api, as well as opting for noting including the PostgresSql connection. 

## Final thoughts.

As requested i tried to code in between the 4-5 hours, this prevented me from doing some extras, like security, swagger and getting a good idea on what to save at Postgres (now that i have finished with scrapping and everything is working properly i just thought that i could use the db to store the scrapped data but we are over the time now, hope that this doesn't declassify me)

## Deploy

The code is deployed at render the url is 
https://valleytest.onrender.com/api/ai/generate-sequence