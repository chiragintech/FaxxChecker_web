import os
import tweepy
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key and secret from environment variables
API_KEY = os.getenv('TWITTER_API_KEY')
API_SECRET = os.getenv('TWITTER_API_SECRET')

# Authenticate to Twitter
client = tweepy.Client(bearer_token=os.getenv('TWITTER_BEARER_TOKEN'))

def get_tweets(username, count):
    try:
        # Get tweets from the user's timeline
        tweets = client.get_users_tweets(id=username, max_results=count, tweet_fields=['text'])
        return [tweet.text for tweet in tweets.data]
    except Exception as e:
        print(f"Error: {e}")
        return []

# Example usage
if __name__ == "__main__":
    username = "realDonaldTrump"
    count = 5  # Change this to 5 to read only 5 tweets
    tweets = get_tweets(username, count)
    for tweet in tweets:
        print(tweet)