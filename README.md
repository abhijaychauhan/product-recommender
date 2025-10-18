# Product Recommendation System# Smart Furniture Assistant (Minimal, Local)



A smart furniture recommendation system that uses AI to help people find products they'll love. Built as an intern project using machine learning, natural language processing, and computer vision.This repository is a minimal, **offline-capable** demo for a product recommendation and analytics app.

It is designed to run locally without Docker and uses FAISS + sentence-transformers for embeddings (you must build them).

## What It Does

## What I included

This app lets you search for furniture using natural language (like "I need a comfy sofa for my living room") and it finds relevant products using AI. It also has a chat interface where you can talk to an AI assistant about products, plus an analytics page to see insights about the product catalog.- `backend/` — FastAPI app and helper script to build embeddings + FAISS index.

  - `main.py` — API server (endpoints: /recommend, /analytics)

## How to Run It  - `ingest_and_build.py` — script to create embeddings and FAISS index (run after installing requirements)

  - `data/products.csv` — your uploaded dataset (from your file)

### Backend Setup  - `models/` — (empty) where FAISS index and products.pkl will be saved by the script

```bash  - `model_training.ipynb` — starter notebook

cd backend

pip install -r requirements.txt- `frontend/` — Vite + React app (Chat + Analytics pages)

python main.py  - run with `npm install` then `npm run dev`

```

The backend will start at http://localhost:8000## Quickstart (recommended order)



### Frontend Setup1. **Backend setup**

```bash   - Create and activate a Python venv (Python 3.9+ recommended)

cd frontend     ```bash

npm install     cd backend

npm run dev     python -m venv venv

```     source venv/bin/activate   # on Windows: venv\\Scripts\\activate

The frontend will be at http://localhost:5173     pip install --upgrade pip

     pip install -r requirements.txt

**Note**: First time running will take a few minutes to download the AI models (~650MB).     ```

   - Build embeddings & FAISS index (this will download models from Hugging Face the first time)

## What's Inside     ```bash

     python ingest_and_build.py

### Tech Stack     ```

- **Backend**: FastAPI, Python     This creates `backend/models/faiss_index.bin` and `backend/models/products.pkl`.

- **Frontend**: React with Vite

- **AI Models**:    - Start FastAPI

  - sentence-transformers for understanding text     ```bash

  - CLIP for image recognition     uvicorn main:app --reload

  - Google Gemini for generating responses (optional)     ```

- **Database**: FAISS vector database for fast similarity search

2. **Frontend setup**

### Main Features   - Open a new terminal

- Smart text search using natural language     ```bash

- Chat interface with AI responses     cd frontend

- Analytics dashboard with charts     npm install

- Image-based product search     npm run dev

- Fast search (under 100ms)     ```

   - Open the URL shown by Vite (usually http://localhost:5173)

## Project Structure

3. **Try it**

```   - In the frontend Chat page, ask for a product (e.g. "mid-century modern wooden chair for study room").

product-recommender/   - If models are built, backend will return recommendations (the basic code returns helpful messages until you run the build script).

├── backend/

│   ├── main.py                    # Main API server## Notes & Next steps

│   ├── cv_module.py               # Computer vision stuff- The project intentionally keeps things minimal and local — no Docker or cloud required.

│   ├── data_analytics.ipynb       # Data analysis notebook- The `ingest_and_build.py` script uses `sentence-transformers/all-MiniLM-L6-v2` for embeddings and FAISS for vector search.

│   ├── model_training.ipynb       # ML model training notebook- Generative descriptions are not precomputed in this minimal version; you can integrate Hugging Face pipelines (e.g., distilgpt2) or LangChain in `backend/main.py` after building the index.

│   ├── requirements.txt           # Python packages- If you want, I can now:

│   ├── data/   - a) Prebuild the FAISS index here for you (requires downloading models — I cannot access the internet reliably in this environment).

│   │   └── products.csv          # Product dataset   - b) Add a lightweight local text generation integration.

│   └── models/   - c) Expand analytics charts.

│       └── faiss_index.bin       # Trained search index

│## Contact

└── frontend/If anything fails, paste the terminal error here and I will help debug step-by-step.
    ├── src/
    │   ├── App.jsx               # Main app component
    │   └── pages/
    │       ├── ChatPage.jsx      # Chat interface
    │       └── AnalyticsPage.jsx # Analytics page
    └── package.json
```

## Try It Out

Once both servers are running:
1. Go to http://localhost:5173 to see the chat interface
2. Try searching for something like "wooden dining table"
3. Check out the analytics page to see product statistics
4. Visit http://localhost:8000/docs to test the API directly

## About the Data

The system uses a dataset of 312 furniture products with information like:
- Product names and descriptions
- Brands, materials, colors
- Prices and dimensions
- Images

The AI converts all this into mathematical vectors that it can search through really fast.

## Notes

- The GenAI feature works with or without an API key (it has smart fallback templates)
- All data processing happens locally - no cloud services needed
- The Jupyter notebooks show how I analyzed the data and trained the models

---

Built for an intern assignment | October 2025
