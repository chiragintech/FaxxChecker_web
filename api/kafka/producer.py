# producer.py
from kafka import KafkaProducer
import json
from googlesearch import search
import requests
from bs4 import BeautifulSoup
import time

class WebCrawlerProducer:
    def __init__(self, bootstrap_servers=['localhost:9092']):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
    def crawl_website(self, url):
        try:
            response = requests.get(url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = soup.title.string if soup.title else "No title"
            description = soup.find('meta', {'name': 'description'})
            description = description.get('content') if description else "No description"
            
            text_content = ' '.join([p.text for p in soup.find_all('p')])[:500]
            
            return {
                'url': url,
                'title': title,
                'description': description,
                'content_preview': text_content,
                'timestamp': time.time()
            }
        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
            return None

    def search_and_produce(self, search_query, topic_name='web_crawler'):
        print(f"Starting search for: {search_query}")
        search_results = list(search(search_query, num_results=10))
        
        for url in search_results:
            data = self.crawl_website(url)
            if data:
                self.producer.send(topic_name, value=data)
                print(f"Produced data for: {url}")
        
        self.producer.flush()
        print("Finished producing messages")

if __name__ == "__main__":
    producer = WebCrawlerProducer()
    search_query = input("Enter search query: ")
    producer.search_and_produce(search_query)