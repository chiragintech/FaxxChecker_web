"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { motion } from "framer-motion";
import {Navbar } from "@/components/Navbar";
export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex items-center justify-center p-4">
      <img className="absolute inset-0 w-full h-full my-100 top-20 object-cover opacity-50" alt="FaxxChecker Logo" src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHdrcW45cTNpdGx3dmNhdnB1dnJ1cWxlbmFiaGE0aWs1bjQ1dnRuOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/jaOXKCxtBPLieRLI0c/giphy.gif" />
      <div className="relative text-center space-y-8">
        
        <div className="relative z-10">
          <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
          >
        <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          FaxxChecker
        </h1>
          </motion.div>

          <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
          >
        <p className="text-2xl text-muted-foreground bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Get your facts right!
        </p>
          </motion.div>

          <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="max-w-md mx-auto p-6 rounded-lg border bg-card text-card-foreground shadow-lg"
          >
        <p className="mb-4">
          Start a conversation with our AI assistant to fact-check any information.
        </p>
        <Link href="/chat">
          <Button size="lg" className="w-full">
            Start Chatting
            <MessageSquare className="ml-2 h-4 w-4" />
          </Button>
        </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}