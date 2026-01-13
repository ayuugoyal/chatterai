"use client"

import { motion } from "framer-motion";
import { Bot, Zap, BarChart3, Code2, MessageSquare, Globe } from 'lucide-react';

const features = [
  {
    title: "Custom AI Agents",
    description: "Create AI chatbots trained on your content. Each agent learns from your URLs, product catalogs, and documentation to provide accurate answers.",
    icon: Bot,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Smart Product Recommendations",
    description: "AI automatically suggests relevant products based on customer questions, increasing cart value and conversion rates by understanding user intent.",
    icon: MessageSquare,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Instant Integration",
    description: "Add AI chat to your website in under 2 minutes with a single line of code. Works on Shopify, WordPress, custom sites, or any platform.",
    icon: Code2,
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Lightning Fast Responses",
    description: "Powered by Google Gemini AI. Get instant, intelligent responses that sound natural and solve customer problems in real-time.",
    icon: Zap,
    color: "bg-yellow-500/10 text-yellow-500",
  },
  {
    title: "Analytics Dashboard",
    description: "Track conversations, monitor agent performance, and understand customer behavior. Get insights to improve your products and support.",
    icon: BarChart3,
    color: "bg-indigo-500/10 text-indigo-500",
  },
  {
    title: "Multi-Language Support",
    description: "Serve global customers with AI that understands and responds in multiple languages. Expand your market without hiring multilingual support staff.",
    icon: Globe,
    color: "bg-pink-500/10 text-pink-500",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-accent/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-medium tracking-wider text-primary bg-primary/10 rounded-full uppercase">
            Powerful Features
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
            Everything You Need to <span className="text-gradient">Automate Customer Support</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Turn website visitors into customers with AI that works 24/7. No technical skills required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl ${feature.color} mb-3 md:mb-4`}>
                <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12 md:mt-16 px-4"
        >
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Join hundreds of businesses using AI to scale their customer support
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-background rounded-full border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-background rounded-full border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-background rounded-full border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
