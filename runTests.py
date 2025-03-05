import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
import pyodbc
from elasticsearch import Elasticsearch
import json
import datetime
import traceback

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

class EsContext:
    def __init__(self):
        self.user_props = {
            'url': os.getenv('ELASTICSEARCH_URL'),
            'username': os.getenv('ELASTICSEARCH_USERNAME'),
            'password': os.getenv('ELASTICSEARCH_PASSWORD')
        }
        self.client = None
        self.init()

    def set_connection_details(self):
        """Establish Elasticsearch connection"""
        self.client = Elasticsearch(
            [self.user_props['url']],
            basic_auth=(self.user_props['username'], self.user_props['password']),
            verify_certs=False  # Equivalent to rejectUnauthorized: false in Node.js
        )

    def verify_client_connection(self):
        """Verify Elasticsearch connection"""
        try:
            info = self.client.info()
            print(f"\033[92mConnected to ElasticSearch user: {self.user_props['username']}\033[0m")
            return True
        except Exception as e:
            print(f"\033[91mFailed to connect to ElasticSearch: {str(e)}\033[0m")
            return False

    def get_all_data(self, index_name):
        """Retrieve all data from an Elasticsearch index"""
        result = self.client.search(index=index_name, body={"query": {"match_all": {}}})
        with open('data.json', 'w') as f:
            json.dump(result['hits']['hits'], f)
        print('Data written to data.json')

    def init(self):
        """Initialize Elasticsearch connection"""
        self.set_connection_details()
        self.verify_client_connection()

# Azure SQL Connection Configuration
def get_sql_connection():
    """Create a connection to Azure SQL Database"""
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={os.getenv('AZURE_SQL_SERVER')};"
        f"DATABASE={os.getenv('AZURE_SQL_DATABASE')};"
        f"UID={os.getenv('AZURE_SQL_USER')};"
        f"PWD={os.getenv('AZURE_SQL_PASSWORD')};"
        "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)

def connect_and_non_query(query):
    """Execute a non-query SQL statement"""
    try:
        with get_sql_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            conn.commit()
        print("New record inserted.")
    except Exception as e:
        print(f"Error: {e}")

def connect_and_query(query):
    """Execute a SQL query and return results"""
    try:
        with get_sql_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return results
    except Exception as e:
        print(f"Error: {e}")
        return None

# Initialize Elasticsearch context
es_context = EsContext()

@app.route('/')
def home():
    """Home route"""
    return "Welcome to notsominapi"

@app.route('/runTests')
def run_tests():
    """Run search query tests"""
    insert_date = datetime.datetime.now().isoformat()
    
    # Fetch search query test set
    sql = 'SELECT * FROM SearchQueryTestSet;'
    search_query_test_set = connect_and_query(sql)
    
    # Process each test
    for search_query_test in search_query_test_set:
        search_id = search_query_test['search_id']
        search_term = search_query_test['search_term']
        expected_results = search_query_test['expected_results']
        
        # Perform Elasticsearch search
        result = es_context.client.search(
            index='dummy_index',
            body={
                "query": {
                    "multi_match": {
                        "query": search_term,
                        "fields": [
                            "fragmentTitle",
                            "shortDescription", 
                            "faqShortAnswer", 
                            "faqLongAnswer"
                        ]
                    }
                },
                "size": 3,
                "_source": [
                    "uuid",
                    "resultType", 
                    "fragmentTitle", 
                    "url", 
                    "shortDescription", 
                    "faqShortAnswer"
                ]
            }
        )
        
        # Process search results
        for result_id, hit in enumerate(result['hits']['hits'], 1):
            source = hit['_source']
            
            # Escape single quotes for SQL
            title = source.get('fragmentTitle', '').replace("'", "''")
            result_type = source.get('resultType', '').replace("'", "''")
            description = source.get('shortDescription', '').replace("'", "''")
            answer = source.get('faqShortAnswer', '').replace("'", "''")
            
            # Check if title matches expected results
            is_match = title in expected_results
            
            # Insert test results into database
            sql = f"""
            INSERT INTO SearchQueryTestResults 
            VALUES (
                '{search_id}', '{result_id}', '{insert_date}', 
                '{search_term}', '{expected_results}', '{is_match}', 
                '{title}', '{result_type}', '{description}', 
                '{answer}', '{hit["_score"]}'
            );
            """
            
            connect_and_non_query(sql)
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)