"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      
      <div className="z-10 flex flex-col items-center text-center max-w-4xl pt-20">
        
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
        >
          AI-Driven Public{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500">
            Health Chatbot
          </span>
        </motion.h1>

        {/* Subtitle text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="text-lg md:text-xl text-foreground/80 max-w-2xl mb-10 leading-relaxed font-semibold"
        >
          Ask questions about diseases, symptoms, and preventive healthcare using AI. 
          The system explains medical information in simple language and supports{" "}
          <span className="text-blue-600 font-bold">multilingual</span>{" "}
          translation with voice playback.
        </motion.p>

        {/* Call to Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/chatbot" className="w-full sm:w-auto block">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-foreground text-background px-8 py-3.5 font-medium shadow-md transition-all w-full h-full"
            >
              Get Started
            </motion.button>
          </Link>
          <Link href="/about" className="w-full sm:w-auto block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-white dark:bg-slate-900 text-foreground dark:text-white border border-gray-200 dark:border-slate-700 px-8 py-3.5 font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all w-full h-full"
            >
              Learn More
            </motion.button>
          </Link>
        </motion.div>
      </div>

    </section>
  );
}
