"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRightIcon, Bot, Zap, Globe } from 'lucide-react';
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

export default function HeroSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        {/* Animated Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-2 py-1 mb-8 text-[12px] font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
              <Zap className="w-4 h-4" />
              AI-Powered Customer Support Platform
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span>Transform Your Website Into a</span>
            <br />
            <span className="text-gradient">24/7 AI Sales Assistant</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-sm sm:text-base md:text-xl mb-6 sm:mb-8 text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Create custom AI chatbots that answer questions, recommend products, and convert visitors into customers.
            <span className="font-semibold text-foreground"> No coding required.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center mb-10 sm:mb-12 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="w-full sm:w-auto">
              <Button size="default" className="gap-2 text-sm sm:text-base w-full sm:w-auto">
                {isSignedIn ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/demo-chat" className="w-full sm:w-auto">
              <Button size="default" variant="outline" className="text-sm sm:text-base w-full sm:w-auto">
                See Live Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground mb-16 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Free Plan Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Works on Any Website</span>
            </div>
          </motion.div>

          {/* Hero Image/Demo */}
          <motion.div
            className="relative rounded-xl border border-border bg-background shadow-2xl overflow-hidden mx-2 sm:mx-0"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.5,
              type: "spring",
              stiffness: 100
            }}
          >
            <div className="aspect-video w-full bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
              <div className="text-center p-4 sm:p-8">
                <Bot className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary" />
                <h3 className="text-lg sm:text-2xl font-bold mb-2">See Chatter AI in Action</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Your AI chatbot, ready in minutes</p>
              </div>
            </div>

            {/* Decorative border beam effect */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/10"></div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
