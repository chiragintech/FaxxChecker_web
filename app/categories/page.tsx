import React from 'react';
import { Card } from "@/components/ui/card";
import { Grid, ArrowRight } from "lucide-react";
import Link from "next/link";

const categories = [
  {
    id: "politics",
    title: "Politics",
    description: "Fact-checking political claims and statements",
    articleCount: 156
  },
  {
    id: "health",
    title: "Health",
    description: "Medical and health-related fact checks",
    articleCount: 243
  },
  {
    id: "science",
    title: "Science",
    description: "Scientific claims and discoveries verification",
    articleCount: 189
  },
  {
    id: "technology",
    title: "Technology",
    description: "Tech news and claims fact-checking",
    articleCount: 167
  },
  {
    id: "environment",
    title: "Environment",
    description: "Environmental and climate fact checks",
    articleCount: 134
  },
  {
    id: "social",
    title: "Social Media",
    description: "Viral content and social media claims",
    articleCount: 278
  }
];

export default function CategoriesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center transform translate-x-4">
        <Grid className="mr-2 h-8 w-8" />
        Categories
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 transform translate-x-4">
        {categories.map((category) => (
          <Link 
            key={category.id} 
            href={`/categories/${category.id}`}
            className="block"
          >
            <Card className="p-6 hover:shadow-lg transition-shadow h-full">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center justify-between">
                  {category.title}
                  <ArrowRight className="h-4 w-4" />
                </h2>
                <p className="text-muted-foreground">{category.description}</p>
                <div className="text-sm text-muted-foreground">
                  {category.articleCount} articles
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}