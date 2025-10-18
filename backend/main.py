# backend/main.py
# FastAPI backend with ML-powered product recommendations
# Features:
#  - POST /recommend  -> Semantic search using FAISS + GenAI descriptions
#  - GET  /analytics  -> Comprehensive dataset analytics
#  - POST /chat      -> Conversational interface for recommendations

import os
import ast
import pickle
import random
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from sklearn.preprocessing import normalize
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import CV module
try:
    from cv_module import load_clip_model, find_similar_products_by_image
    CV_AVAILABLE = True
except ImportError:
    CV_AVAILABLE = False
    print("⚠️ CV module not available")

app = FastAPI(
    title="Smart Furniture Recommendation System",
    description="AI-powered product recommendations using NLP, CV, and GenAI",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Global variables for models and data
BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "data", "products.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# GenAI Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
else:
    gemini_model = None

# Load models on startup
embedding_model = None
faiss_index = None
products_df = None
chat_history = []

def load_models():
    """Load ML models and data on startup"""
    global embedding_model, faiss_index, products_df
    
    try:
        # Load sentence transformer
        print("🔄 Loading sentence transformer model...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Load FAISS index
        faiss_path = os.path.join(MODELS_DIR, "faiss_index.bin")
        if os.path.exists(faiss_path):
            print("🔄 Loading FAISS index...")
            faiss_index = faiss.read_index(faiss_path)
            print(f"✅ FAISS index loaded: {faiss_index.ntotal} vectors")
        
        # Load products dataframe
        products_pkl = os.path.join(MODELS_DIR, "products.pkl")
        if os.path.exists(products_pkl):
            print("🔄 Loading products data...")
            products_df = pd.read_pickle(products_pkl)
            print(f"✅ Products loaded: {len(products_df)} items")
        else:
            # Fallback to CSV
            products_df = pd.read_csv(DATA_PATH)
            print(f"⚠️  Using CSV data: {len(products_df)} items")
        
        # Load CLIP model for Computer Vision (optional)
        if CV_AVAILABLE:
            load_clip_model()
        
        print("✅ All models loaded successfully!")
        
    except Exception as e:
        print(f"⚠️  Error loading models: {e}")
        print("   Using fallback mode with limited functionality")

# Load models on startup
load_models()

# Pydantic models
class QueryModel(BaseModel):
    query: str
    top_k: Optional[int] = 5

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = "default"

class ImageSearchModel(BaseModel):
    image_url: str
    top_k: Optional[int] = 5

class ProductResponse(BaseModel):
    title: str
    brand: str
    price: str
    description: str
    enhanced_description: str
    images: List[str]
    color: Optional[str]
    material: Optional[str]
    similarity_score: float
    uniq_id: str

def parse_images(img_str):
    """Parse image URLs from string"""
    try:
        imgs = ast.literal_eval(img_str)
        if isinstance(imgs, list):
            return [img.strip() for img in imgs if img and img.strip()]
        return []
    except:
        return []

def generate_ai_description(product):
    """Generate creative product description using GenAI (Gemini)"""
    
    # If Gemini is configured, use it for real AI descriptions
    if gemini_model:
        try:
            prompt = f"""Write a compelling, engaging product description (2-3 sentences) for this furniture item:
            
Product: {product.get('title', 'Unknown')}
Brand: {product.get('brand', 'Unknown')}
Color: {product.get('color', 'Not specified')}
Material: {product.get('material', 'Not specified')}
Price: {product.get('price', 'Not specified')}

Make it sound premium and appealing to customers. Focus on benefits, style, and quality."""

            response = gemini_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"⚠️ GenAI error: {e}, falling back to template")
    
    # Fallback to template-based generation
    templates = [
        f"Discover the perfect blend of style and functionality with {product.get('title', 'this product')}. ",
        f"Elevate your space with this {product.get('color', 'stunning')} masterpiece. ",
        f"Transform your home with this elegant piece from {product.get('brand', 'our collection')}. ",
        f"Experience premium quality and design with {product.get('title', 'this exceptional product')}. ",
    ]
    
    base = random.choice(templates)
    
    # Add material and color details
    details = []
    if pd.notna(product.get('material')):
        details.append(f"Crafted from high-quality {product['material']}")
    if pd.notna(product.get('color')):
        details.append(f"featuring a beautiful {product['color']} finish")
    
    if details:
        base += " ".join(details) + ". "
    
    # Add original description if available
    if pd.notna(product.get('description')):
        base += str(product['description'])[:150]
    else:
        base += "Perfect for modern living spaces and designed to last."
    
    return base

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Product Recommendation System",
        "models_loaded": {
            "embedding_model": embedding_model is not None,
            "faiss_index": faiss_index is not None and faiss_index.ntotal > 0,
            "products_data": products_df is not None
        }
    }

@app.post("/recommend", response_model=List[ProductResponse])
def recommend(q: QueryModel):
    """
    Get product recommendations using semantic search
    
    - Uses sentence transformers for query embedding
    - FAISS for fast similarity search
    - GenAI for enhanced descriptions
    """
    if embedding_model is None or faiss_index is None or products_df is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Please run model_training.ipynb first."
        )
    
    try:
        # Encode query
        query_embedding = embedding_model.encode([q.query], convert_to_numpy=True)
        query_embedding = normalize(query_embedding, norm='l2', axis=1).astype('float32')
        
        # Search in FAISS
        distances, indices = faiss_index.search(query_embedding, q.top_k)
        
        # Prepare results
        results = []
        for idx, score in zip(indices[0], distances[0]):
            product = products_df.iloc[idx]
            
            # Handle NaN values properly
            def safe_get(value, default=''):
                if pd.isna(value):
                    return default
                return str(value)
            
            results.append(ProductResponse(
                title=safe_get(product.get('title'), 'Unknown Product'),
                brand=safe_get(product.get('brand'), 'Unknown'),
                price=safe_get(product.get('price'), 'N/A'),
                description=safe_get(product.get('description'), 'No description available'),
                enhanced_description=generate_ai_description(product),
                images=parse_images(product.get('images', '[]')),
                color=safe_get(product.get('color'), None),
                material=safe_get(product.get('material'), None),
                similarity_score=float(score),
                uniq_id=safe_get(product.get('uniq_id'), '')
            ))
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.post("/chat")
def chat(msg: ChatMessage):
    """
    Conversational interface for product recommendations
    
    - Uses GenAI for natural responses
    - Maintains chat history
    - Returns recommendations with context
    """
    global chat_history
    
    # Add message to history
    chat_history.append({"role": "user", "message": msg.message})
    
    # Get recommendations
    try:
        recommendations = recommend(QueryModel(query=msg.message, top_k=3))
        
        # Generate AI response if Gemini is available
        if gemini_model:
            try:
                # Create context with product titles
                product_list = ", ".join([r.title for r in recommendations[:3]])
                
                prompt = f"""You are a helpful furniture shopping assistant. The user asked: "{msg.message}"

I found these products: {product_list}

Write a friendly, conversational response (1-2 sentences) introducing these recommendations. Be helpful and enthusiastic."""

                response = gemini_model.generate_content(prompt)
                response_text = response.text.strip()
            except:
                response_text = f"I found {len(recommendations)} great options for you!"
        else:
            response_text = f"I found {len(recommendations)} great options for you!"
        
        chat_history.append({"role": "assistant", "message": response_text})
        
        return {
            "response": response_text,
            "recommendations": recommendations,
            "chat_history": chat_history[-10:]  # Last 10 messages
        }
    except Exception as e:
        error_msg = "I'm having trouble finding products right now. Please try again."
        chat_history.append({"role": "assistant", "message": error_msg})
        return {
            "response": error_msg,
            "recommendations": [],
            "chat_history": chat_history[-10:]
        }

@app.post("/search-by-image", response_model=List[ProductResponse])
def search_by_image(req: ImageSearchModel):
    """
    Find similar products using Computer Vision (CLIP)
    
    - Upload or provide URL to a furniture image
    - Returns visually similar products
    """
    if not CV_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Computer Vision module not available. Please install required dependencies."
        )
    
    if products_df is None:
        raise HTTPException(status_code=503, detail="Products data not loaded")
    
    try:
        # Find similar products by image
        similar_products = find_similar_products_by_image(
            req.image_url, 
            products_df, 
            top_k=req.top_k
        )
        
        if not similar_products:
            raise HTTPException(
                status_code=404, 
                detail="No similar products found or error processing image"
            )
        
        # Prepare results
        results = []
        for idx, score in similar_products:
            product = products_df.iloc[idx]
            
            def safe_get(value, default=''):
                if pd.isna(value):
                    return default
                return str(value)
            
            results.append(ProductResponse(
                title=safe_get(product.get('title'), 'Unknown Product'),
                brand=safe_get(product.get('brand'), 'Unknown'),
                price=safe_get(product.get('price'), 'N/A'),
                description=safe_get(product.get('description'), 'No description available'),
                enhanced_description=generate_ai_description(product),
                images=parse_images(product.get('images', '[]')),
                color=safe_get(product.get('color'), None),
                material=safe_get(product.get('material'), None),
                similarity_score=float(score),
                uniq_id=safe_get(product.get('uniq_id'), '')
            ))
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image search error: {str(e)}")

@app.get("/analytics")
def analytics():
    """
    Comprehensive dataset analytics
    
    Returns statistics on:
    - Brands
    - Prices
    - Materials
    - Colors
    - Categories
    """
    df = products_df.copy() if products_df is not None else pd.read_csv(DATA_PATH)
    
    analytics_data = {
        "total_products": len(df),
        "dataset_health": {
            "title": f"{df['title'].notna().sum()} / {len(df)}",
            "description": f"{df['description'].notna().sum()} / {len(df)}",
            "price": f"{df['price'].notna().sum()} / {len(df)}",
            "images": f"{df['images'].notna().sum()} / {len(df)}"
        }
    }
    
    # Brand analysis
    if 'brand' in df.columns:
        brand_counts = df['brand'].fillna("Unknown").value_counts().head(15)
        analytics_data['top_brands'] = brand_counts.to_dict()
    
    # Price analysis
    if 'price' in df.columns:
        df['price_numeric'] = df['price'].str.replace('$', '').str.replace(',', '')
        df['price_numeric'] = pd.to_numeric(df['price_numeric'], errors='coerce')
        
        price_data = df[df['price_numeric'].notna()]
        if len(price_data) > 0:
            analytics_data['price_stats'] = {
                "avg": float(price_data['price_numeric'].mean()),
                "median": float(price_data['price_numeric'].median()),
                "min": float(price_data['price_numeric'].min()),
                "max": float(price_data['price_numeric'].max())
            }
    
    # Material analysis
    if 'material' in df.columns:
        material_counts = df['material'].fillna('Unknown').value_counts().head(15)
        analytics_data['materials'] = material_counts.to_dict()
    
    # Color analysis
    if 'color' in df.columns:
        color_counts = df['color'].fillna('Unknown').value_counts().head(15)
        analytics_data['colors'] = color_counts.to_dict()
    
    # Category analysis
    def get_main_category(cat_str):
        try:
            cats = ast.literal_eval(cat_str)
            return cats[0] if isinstance(cats, list) and len(cats) > 0 else 'Unknown'
        except:
            return 'Unknown'
    
    if 'categories' in df.columns:
        df['main_category'] = df['categories'].apply(get_main_category)
        cat_counts = df['main_category'].value_counts().head(10)
        analytics_data['categories'] = cat_counts.to_dict()
    
    return analytics_data

@app.get("/products/{product_id}")
def get_product(product_id: str):
    """Get details for a specific product"""
    if products_df is None:
        raise HTTPException(status_code=503, detail="Products data not loaded")
    
    product = products_df[products_df['uniq_id'] == product_id]
    
    if len(product) == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = product.iloc[0]
    
    return {
        "title": product['title'],
        "brand": product.get('brand', 'Unknown'),
        "price": product.get('price', 'N/A'),
        "description": product.get('description', ''),
        "images": parse_images(product.get('images', '[]')),
        "color": product.get('color'),
        "material": product.get('material'),
        "categories": product.get('categories'),
        "manufacturer": product.get('manufacturer'),
        "country_of_origin": product.get('country_of_origin'),
        "package_dimensions": product.get('package_dimensions'),
        "uniq_id": product['uniq_id']
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)