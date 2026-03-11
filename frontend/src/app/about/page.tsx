"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Languages, Zap, HeartPulse, Brain } from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: <Brain className="text-blue-500 w-6 h-6" />,
      title: "Advanced AI Engine",
      description: "Powered by leading language models to provide accurate, up-to-date public health information in simple terms."
    },
    {
      icon: <Languages className="text-purple-500 w-6 h-6" />,
      title: "Multilingual Support",
      description: "Break language barriers with seamless translation and voice playback capabilities tailored for diverse communities."
    },
    {
      icon: <ShieldCheck className="text-green-500 w-6 h-6" />,
      title: "Preventive Focus",
      description: "Learn about preventive healthcare measures and vaccination schedules to keep yourself and your family safe."
    },
    {
      icon: <HeartPulse className="text-orange-500 w-6 h-6" />,
      title: "Symptom Checking",
      description: "Quickly analyze your symptoms and receive AI-driven guidance on whether you should consult a medical professional."
    },
    {
      icon: <Activity className="text-pink-500 w-6 h-6" />,
      title: "Disease Database",
      description: "Access an extensive library of information covering common colds, chronic illnesses, and localized outbreaks."
    },
    {
      icon: <Zap className="text-yellow-500 w-6 h-6" />,
      title: "Lightning Fast",
      description: "Get answers instantly without having to navigate confusing medical portals or wait for search engine results."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800 mb-6"
          >
            About ArogyAI Project
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Revolutionizing Public <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Healthcare Accessibility
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-slate-900 dark:text-white font-semibold leading-relaxed"
          >
            ArogyAI was built with a single mission: to provide immediate, understandable, and accessible medical information for everyone. We believe that AI can be the bridge between complex medical literacy and the general public.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-6 border border-gray-100 dark:border-slate-600 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">{feature.title}</h3>
              <p className="text-gray-500 dark:text-slate-300 leading-relaxed font-normal">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </main>
    </div>
  );
}
