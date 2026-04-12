# 🦠 Patho | Dynamic Epidemic Intelligence

[![Next.js](https://img.shields.io/badge/Next.js-Black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.13](https://img.shields.io/badge/Python_3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Making public health data natively accessible through generative AI and interactive visualization.**

## 💡 The Inspiration
Traditional data dashboards are heavily visual, creating a massive barrier for users who rely on screen readers. Standard alt-text fundamentally fails to capture the nuance of dynamic geographic trends and shifting datasets. 

We wanted to solve this by building a tool at the intersection of web technology and accessibility. Patho transforms complex, localized epidemic data into conversational, on-demand audio insights, pushing the boundaries of how we interact with public health intelligence.

## 🚀 What It Does
Patho is a full-stack, interactive dashboard that tracks COVID-19 data across the United States with a focus on multimodal delivery:
* **Interactive Spatial Mapping:** Clickable, state-and-county-level US map rendering real-time case and death metrics.
* **Generative AI Synthesizer:** Instead of robotic text-to-speech, Patho streams local data to an LLM to dynamically draft a natural, uniquely phrased conversational summary of the region's health status.
* **Stateless Audio Streaming:** Utilizing ElevenLabs, the custom summary is instantly synthesized and streamed directly to the user's browser without requiring messy local disk caching or file storage.
* **Predictive Architecture:** Built-in hooks for predictive modeling (utilizing our backend historical datasets) to forecast regional outbreak trends.

## ⚙️ How We Built It
We utilized a high-growth, modern tech stack designed for speed and scalability:
* **Frontend:** Next.js (App Router), styled with Tailwind CSS and utilizing `react-simple-maps` for the interactive UI.
* **Backend:** A stateless FastAPI architecture running on **Python 3.13**, handling CORS, data routing, and rapid API responses.
* **AI & Voice:** We integrated the **Meta-Llama-3-8B-Instruct** model via the Featherless API to draft the narrative scripts, piped directly into the **ElevenLabs Multilingual v2** model to generate hyper-realistic audio streams on the fly. 

## 🧠 Challenges We Ran Into
* **Audio State Management:** Preventing users from triggering a dozen overlapping voice lines by clicking multiple counties rapidly required building a robust custom React hook to track the browser's native `Audio` object state.
* **Bypassing Caching Layers:** Next.js and typical backend deployments aggressively cache files. We had to specifically engineer our FastAPI endpoints using `StreamingResponse` to push raw byte chunks to the frontend, ensuring every LLM-generated audio file was truly unique and ephemeral.
* **Reconciling Divergent Git Histories:** Managing collaborative development across a UI-focused frontend and an LLM-heavy backend required strict branching strategies and conflict resolution to keep our main pipeline clean.

## 🏆 Accomplishments That We're Proud Of
We successfully bridged the gap between raw CSV datasets and human-sounding conversational AI. The ability to click a county in Texas and immediately hear a dynamically generated, non-repetitive voice report on its current health status in under 2 seconds is incredibly satisfying. 

## 🔭 What's Next for Patho
* **Predictive Analytics Engine:** We plan to fully operationalize our `generate_predictions.py` logic to not just report current cases, but have the AI verbally warn users of projected spikes in their clicked region.
* **Hardware Integration:** Exploring embedded firmware possibilities to bring this data-streaming capability to physical accessibility devices or IoT health monitors.

***

## 💻 Getting Started (Local Development)

### Prerequisites
* Node.js & `pnpm`
* Python 3.13
* API Keys for Featherless AI & ElevenLabs

### 1. Backend Setup (macOS / Linux)
Open your terminal and navigate to the backend directory:
bash
cd backend

# Create a virtual environment using Python 3.13
python3.13 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pandas elevenlabs requests

# Set up your environment variables
touch .env

Add the following to your .env file:
FEATHERLESS_KEY=your_api_key
ELEVENLABS_API_KEY=your_api_key

Start the backend server:
uvicorn main:app --reload --port 8000

### 2. Frontend Setup
In a new terminal window, navigate to the frontend directory:
cd frontend

# Install packages
pnpm install

# Start the Next.js development server
pnpm dev

Open http://localhost:3000 in your browser to interact with Patho!
