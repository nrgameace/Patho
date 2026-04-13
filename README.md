# 🦠 Patho | Dynamic Epidemic Intelligence - WashU 2026 Google DevFest Best Use of Featherless AI

[![Next.js](https://img.shields.io/badge/Next.js-Black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.13](https://img.shields.io/badge/Python_3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Making public health data natively accessible through interactive visualization and predictive architecture.**

## 💡 The Inspiration
Traditional data dashboards are heavily visual, creating a massive barrier for users who rely on screen readers. Standard alt-text fundamentally fails to capture the nuance of dynamic geographic trends and shifting datasets. 

We wanted to solve this by building a tool at the intersection of web technology and accessibility. Patho is designed to transform complex, localized epidemic data into highly interactive, accessible insights, pushing the boundaries of how we interact with public health intelligence.

## 🚀 What It Does
Patho is a full-stack, interactive dashboard that tracks COVID-19 data across the United States:
* **Interactive Spatial Mapping:** Clickable, state-and-county-level US map rendering real-time case and death metrics with dynamic color-scaling.
* **Granular Data Routing:** Fast, stateless backend querying that filters nationwide datasets down to specific FIPS county codes instantly.
* **Predictive Architecture:** Built-in hooks for predictive modeling (utilizing our backend historical datasets) to forecast regional outbreak trends.

## ⚙️ How We Built It
We utilized a high-growth, modern tech stack designed for speed and scalability:
* **Frontend:** Next.js (App Router), styled with Tailwind CSS and utilizing `react-simple-maps` for the interactive, zoomable UI.
* **Backend:** A stateless FastAPI architecture running on **Python 3.13**, handling CORS, data routing, and rapid API responses using Pandas for complex CSV data manipulation.

## 🧠 Challenges We Ran Into
* **Geospatial Data Mapping:** Syncing raw CSV public health data to TopoJSON boundaries required precise FIPS code matching and careful state management to ensure the correct county data rendered smoothly without UI lag.
* **Reconciling Divergent Git Histories:** Managing collaborative development across a UI-focused frontend (Next.js) and a data-heavy backend (FastAPI) required strict branching strategies and conflict resolution to keep our main pipeline clean.

## 🏆 Accomplishments That We're Proud Of
We successfully bridged the gap between massive, raw CSV datasets and a clean, highly responsive UI. Building a completely custom, interactive map of the United States that can drill down from a national view to specific county-level statistics with zero latency is incredibly satisfying. 

## 🔭 What's Next for Patho
* **Generative AI Audio Synthesizer:** Our immediate next step is integrating the **Featherless API (Meta-Llama-3)** and **ElevenLabs**. Instead of robotic text-to-speech, Patho will stream local data to an LLM to dynamically draft a uniquely phrased conversational summary of a clicked region, synthesizing and streaming the audio directly to the user's browser for true multimodal accessibility.
* **Predictive Analytics Engine:** We plan to fully operationalize our `generate_predictions.py` logic to not just report current cases, but warn users of projected spikes in their selected region.

***

# 💻 Getting Started (Local Development)

## Prerequisites
* Node.js & `pnpm`
* Python 3.13

## 1. Backend Setup (macOS / Linux)
Open your terminal and navigate to the backend directory:
bash
cd backend

### Create a virtual environment using Python 3.13
python3.13 -m venv venv
source venv/bin/activate

### Install dependencies
pip install fastapi uvicorn pandas

### Start the backend server
uvicorn main:app --reload --port 8000

## 2. Frontend Setup
In a new terminal window, navigate to the frontend directory:

cd frontend

### Install packages
pnpm install

### Start the Next.js development server
pnpm dev

Open http://localhost:3000 in your browser to interact with Patho!
Built with ❤️ in St. Louis.
