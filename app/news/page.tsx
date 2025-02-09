"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Newspaper, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  url: string;
  content: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async (query: string = 'latest news') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/news/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching articles');
      console.error('Error fetching articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);



  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold flex items-center translate translate-x-6">
          <Newspaper className="mr-2 h-8 w-8 translate translate-x-1" />
          Latest News
        </h1>

   

        {error && (
          <div className="text-red-500 bg-red-50 p-4 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Card key={article.id} className="p-6 hover:shadow-lg transition-shadow translate translate-x-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {article.category}
                    </span>
                    <h2 className="text-xl font-semibold line-clamp-2">{article.title}</h2>
                    <p className="text-muted-foreground line-clamp-3">{article.excerpt}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {new Date(article.date).toLocaleDateString()}
                    </span>
                    <Link 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
                      Read more
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}