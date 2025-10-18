# Backend API

This is the FastAPI server that handles all the AI and machine learning stuff for product recommendations.

## Installation

```bash
pip install -r requirements.txt
```

**Note**: First run will download AI models (~650MB). It's normal to wait a few minutes.

## Running the Server

```bash
python main.py
```

Server runs at http://localhost:8000

## API Endpoints

### GET /
Health check - tells you if all the models loaded correctly

### POST /recommend
Search for products using natural language
```json
{
  "query": "comfortable sofa for small apartment",
  "top_k": 5
}
```

### POST /chat
Chat interface with AI assistant
```json
{
  "message": "I need furniture for my bedroom",
  "context": []
}
```

### POST /search-by-image
Find products similar to an image (computer vision)

### GET /analytics
Get statistics about the product catalog

### GET /products/{id}
Get details for a specific product

### GET /docs
Interactive API documentation (Swagger UI) - really useful for testing!

## How It Works

The system uses three main AI models:

1. **sentence-transformers**: Converts text into mathematical vectors that capture meaning. When you search for "comfy chair", it understands what you mean even if products don't use those exact words.

2. **FAISS**: A fast similarity search system from Facebook (Meta). It finds the most similar products to your search in milliseconds by comparing vectors.

3. **CLIP**: OpenAI's computer vision model that understands both images and text. Can match products based on visual similarity.

4. **Gemini (optional)**: Google's AI for generating natural-sounding product descriptions and chat responses. Works with templates if you don't have an API key.

## Files

- `main.py` - Main API server with all endpoints
- `cv_module.py` - Computer vision functions using CLIP
- `data_analytics.ipynb` - Jupyter notebook with data exploration
- `model_training.ipynb` - Notebook showing how the models were trained
- `data/products.csv` - Product dataset (312 items)
- `models/` - Trained model files (FAISS index, embeddings)
- `.env.example` - Example configuration file

## Configuration (Optional)

To use real Gemini AI instead of templates:

1. Get a free API key from https://makersuite.google.com/app/apikey
2. Copy `.env.example` to `.env`
3. Add your key: `GEMINI_API_KEY=your_key_here`
4. Restart the server

The system works fine without this - it has smart fallback responses built in.

## Development Notes

### Data Processing
The system loads `products.csv` and creates "rich text" for each product by combining title, description, brand, material, color, etc. This gives the AI more context to work with.

### Vector Search
Each product gets converted to a 384-dimensional vector. When you search, your query becomes a vector too, and FAISS finds the nearest matches using cosine similarity.

### Performance
- Search latency: Usually under 100ms
- Model loading: ~10 seconds on first start
- Memory usage: ~2GB with all models loaded

## Troubleshooting

**Port already in use?**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /F /PID <pid_number>
```

**Models not loading?**
- Check internet connection (needed for first download)
- Make sure you have enough disk space (~2GB)
- Try deleting `.cache` folder and restarting

**Import errors?**
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

## Tech Stack

- **FastAPI** - Modern Python web framework
- **sentence-transformers** - NLP model from HuggingFace
- **FAISS** - Vector similarity search
- **CLIP** - Computer vision model
- **PyTorch** - Deep learning framework
- **pandas, numpy** - Data processing
- **google-generativeai** - Optional GenAI integration

---

For more info, check out the main README in the project root.
