# backend/cv_module.py
# Computer Vision module using CLIP for image similarity search

import torch
from PIL import Image
import requests
from io import BytesIO
import numpy as np

# Global variables
clip_model = None
clip_processor = None

def load_clip_model():
    """Load CLIP model for image-text understanding"""
    global clip_model, clip_processor
    
    try:
        from transformers import CLIPProcessor, CLIPModel
        
        print("🔄 Loading CLIP model for Computer Vision...")
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        # Set to eval mode
        clip_model.eval()
        
        print("✅ CLIP model loaded successfully!")
        return True
    except Exception as e:
        print(f"⚠️ Could not load CLIP: {e}")
        return False

def get_image_from_url(url):
    """Download and load image from URL"""
    try:
        response = requests.get(url, timeout=5)
        img = Image.open(BytesIO(response.content)).convert('RGB')
        return img
    except Exception as e:
        print(f"⚠️ Error loading image from {url}: {e}")
        return None

def get_image_embedding(image_url):
    """Generate CLIP embedding for an image"""
    if clip_model is None or clip_processor is None:
        return None
    
    try:
        # Load image
        image = get_image_from_url(image_url)
        if image is None:
            return None
        
        # Process image
        inputs = clip_processor(images=image, return_tensors="pt")
        
        # Get embedding
        with torch.no_grad():
            image_features = clip_model.get_image_features(**inputs)
            # Normalize
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        
        return image_features.numpy()[0]
    except Exception as e:
        print(f"⚠️ Error getting image embedding: {e}")
        return None

def get_text_embedding(text):
    """Generate CLIP embedding for text"""
    if clip_model is None or clip_processor is None:
        return None
    
    try:
        inputs = clip_processor(text=[text], return_tensors="pt", padding=True)
        
        with torch.no_grad():
            text_features = clip_model.get_text_features(**inputs)
            # Normalize
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        return text_features.numpy()[0]
    except Exception as e:
        print(f"⚠️ Error getting text embedding: {e}")
        return None

def compute_similarity(embedding1, embedding2):
    """Compute cosine similarity between two embeddings"""
    if embedding1 is None or embedding2 is None:
        return 0.0
    
    # Cosine similarity (embeddings are already normalized)
    similarity = np.dot(embedding1, embedding2)
    return float(similarity)

def find_similar_products_by_image(image_url, products_df, top_k=5):
    """Find similar products based on image similarity"""
    if clip_model is None:
        return []
    
    try:
        # Get embedding for query image
        query_embedding = get_image_embedding(image_url)
        if query_embedding is None:
            return []
        
        # Calculate similarities with all products
        similarities = []
        for idx, product in products_df.iterrows():
            # Get first image from product
            import ast
            try:
                images = ast.literal_eval(product.get('images', '[]'))
                if not images:
                    continue
                
                product_image_url = images[0]
                product_embedding = get_image_embedding(product_image_url)
                
                if product_embedding is not None:
                    similarity = compute_similarity(query_embedding, product_embedding)
                    similarities.append((idx, similarity))
            except:
                continue
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top-k results
        return [(idx, score) for idx, score in similarities[:top_k]]
    
    except Exception as e:
        print(f"⚠️ Error in image search: {e}")
        return []

def multimodal_search(text_query, image_url, products_df, text_embeddings, top_k=5, text_weight=0.6, image_weight=0.4):
    """
    Combined text + image search
    
    Args:
        text_query: Text search query
        image_url: Optional image URL for visual search
        products_df: Product dataframe
        text_embeddings: Pre-computed text embeddings from sentence transformers
        top_k: Number of results to return
        text_weight: Weight for text similarity (0-1)
        image_weight: Weight for image similarity (0-1)
    """
    if clip_model is None:
        return []
    
    try:
        # Get text embedding using CLIP
        text_emb = get_text_embedding(text_query)
        if text_emb is None:
            return []
        
        # Calculate combined scores
        combined_scores = []
        
        for idx, product in products_df.iterrows():
            # Text similarity (using CLIP text encoder for consistency)
            text_sim = compute_similarity(text_emb, text_embeddings[idx]) if text_embeddings is not None else 0.0
            
            # Image similarity (if image provided)
            image_sim = 0.0
            if image_url:
                import ast
                try:
                    images = ast.literal_eval(product.get('images', '[]'))
                    if images:
                        product_image_url = images[0]
                        product_img_emb = get_image_embedding(product_image_url)
                        query_img_emb = get_image_embedding(image_url)
                        
                        if product_img_emb is not None and query_img_emb is not None:
                            image_sim = compute_similarity(query_img_emb, product_img_emb)
                except:
                    pass
            
            # Combined score
            combined_score = (text_weight * text_sim) + (image_weight * image_sim)
            combined_scores.append((idx, combined_score, text_sim, image_sim))
        
        # Sort by combined score
        combined_scores.sort(key=lambda x: x[1], reverse=True)
        
        return combined_scores[:top_k]
    
    except Exception as e:
        print(f"⚠️ Error in multimodal search: {e}")
        return []
