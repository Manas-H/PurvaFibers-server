import json
import os
import sys
from bson import ObjectId
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Load environment variables
load_dotenv()
mongo_url = os.environ.get('MONGO_URL')

# Connect to MongoDB
client = MongoClient(mongo_url)
db = client['purvafiber']
Product = db['products']

# Define a function to preprocess the data
def preprocess_products(products):
    for product in products:
        product_id = product['_id']
        product['features'] = f"{product_id} {product['category']} {product['Dimensions']}"
    return products

# Define a function to compute the cosine similarity between products
def get_similarity(products):
    tfidf = TfidfVectorizer(stop_words='english')
    matrix = tfidf.fit_transform(products)
    similarity = cosine_similarity(matrix)
    return similarity.tolist()

# Define a function to load the products and compute the similarity matrix
def load_products():
    products = Product.find({})
    preprocessed_products = preprocess_products(list(products))
    similarity = get_similarity([product['features'] for product in preprocessed_products])
    return [preprocessed_products, similarity]

# Define a function to get the recommended products
def get_recommendations(product_id, products, similarity, n=3):
    idx = [str(product['_id']) for product in products].index(str(product_id))
    sim_scores = similarity[idx]
    sorted_indices = sorted(range(len(sim_scores)), key=lambda i: sim_scores[i], reverse=True)
    top_n_indices = sorted_indices[1:n+1]
    top_n_products = [products[i] for i in top_n_indices]
    top_n_products_dict = []
    for product in top_n_products:
        product_dict = {
            '_id': str(product['_id']),
            'name': product['name'],
            'category': product['category'],
            'Dimensions': product['Dimensions'],
            'esp': product['esp'],
            'mrp': product['mrp'],
            'description': product['description'],
            'discount' : product['discount'],
            'images' : product['images'],
            'productid' : product['productid'],
            'seriesid' : product['seriesid'],
            'drain' : product['drain']


        }
        top_n_products_dict.append(product_dict)
    return top_n_products_dict

# Parse command-line arguments
product_id = ObjectId(sys.argv[1])

# Load the products and compute the similarity matrix
products, similarity = load_products()

# Get the recommended products and convert to JSON format
recommendations = get_recommendations(product_id, products, similarity)
data = {'product': str(product_id), 'recommendations': recommendations}
json_data = json.dumps(data)

# Send the JSON data to the Node.js script
print(json_data)
