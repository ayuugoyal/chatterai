"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number */}
          <motion.h1
            className="text-[150px] md:text-[200px] font-bold leading-none bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 100,
            }}
          >
            404
          </motion.h1>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-4 mb-8"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Oops! The page you&apos;re looking for seems to have wandered off into the digital void.
              Let&apos;s get you back on track.
            </p>
          </motion.div>

          {/* Animated Robot/Bot Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-block p-6 rounded-full bg-primary/10">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <Search className="w-16 h-16 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={() => router.back()}
              variant="outline"
              className="group w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>

            <Button size="lg" asChild className="group w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Back to Home
              </Link>
            </Button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 pt-8 border-t border-border"
          >
            <p className="text-sm text-muted-foreground mb-4">
              You might be looking for:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/dashboard"
                className="text-sm text-primary hover:underline"
              >
                Dashboard
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/sign-in"
                className="text-sm text-primary hover:underline"
              >
                Sign In
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/sign-up"
                className="text-sm text-primary hover:underline"
              >
                Sign Up
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/#features"
                className="text-sm text-primary hover:underline"
              >
                Features
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
