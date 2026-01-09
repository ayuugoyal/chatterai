"use client"
import React from 'react'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger } from "@/components/ui/animated-modal"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { AgentFormValues, createAgent } from '@/lib/actions/agent-actions'
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  slug: z
    .string()
    .min(2, {
      message: "Slug must be at least 2 characters.",
    })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens.",
    }),
  systemPrompt: z.string().min(10, {
    message: "System prompt must be at least 10 characters.",
  }),
  modelProvider: z.enum(["gemini", "anthropic", "openai"]),
  urls: z.array(z.string().url("Invalid URL")).optional(),
  saveConversations: z.boolean().default(true),
  // Custom API keys (optional)
  geminiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
})

// Function to generate a random string of specified length
function generateRandomString(length = 6) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function AgentPopUp() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      systemPrompt: "You are a helpful AI assistant that answers questions about our products and services.",
      modelProvider: "gemini",
      saveConversations: true,
    },
  })

  // Generate unique slug when name changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name) {
        const baseSlug = value.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const uniqueSlug = `${baseSlug}-${generateRandomString()}`;
        form.setValue('slug', uniqueSlug);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      console.log("Form values:", values)
      const result = await createAgent(values as AgentFormValues)
      console.log("Result:", result)

      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else if (result?.success) {
        toast({
          title: "Agent created",
          description: `Your agent "${values.name}" has been created successfully.`,
        })
        router.push(`/dashboard/agents/${result.agentId}`)
        // router.refresh()
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreate = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <div>
      <Modal>
        <ModalTrigger className="bg-primary hover:bg-primary/90 text-white flex justify-center group/modal-btn border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-3">
          <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500 font-semibold flex items-center gap-2">
            <span className="text-lg">+</span> Create Agent
          </span>
          <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
            🤖
          </div>
        </ModalTrigger>
        <ModalBody className="md:max-w-4xl">
          <ModalContent className="overflow-y-auto max-h-[90vh]">
            <Form {...form}>
              <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex flex-col gap-2 border-b pb-6">
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Create New Agent</h1>
                  <p className="text-muted-foreground text-lg">Build a custom AI agent trained on your data.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Agent Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Support Bot, Sales Assistant"
                              className="h-12 text-md transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>This name will be displayed to your users.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Slug (URL)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. support-bot-abc123"
                              className="h-12 text-md font-mono transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for your agent's URL. Auto-generated but editable.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="modelProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">AI Model</FormLabel>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            {[
                              { value: 'gemini', label: 'Gemini' },
                              { value: 'anthropic', label: 'Claude' },
                              { value: 'openai', label: 'GPT' }
                            ].map((provider) => (
                              <div
                                key={provider.value}
                                onClick={() => field.onChange(provider.value)}
                                className={`
                                  cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200
                                  ${field.value === provider.value
                                    ? 'border-primary bg-primary/5 shadow-md scale-105'
                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'}
                                `}
                              >
                                <span className="font-semibold">{provider.label}</span>
                                <div className={`w-3 h-3 rounded-full ${field.value === provider.value ? 'bg-green-500' : 'bg-gray-300'}`} />
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="saveConversations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold">Save Conversations</FormLabel>
                            <FormDescription>
                              Store user conversations for analytics and review
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">System Personality</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe how your agent should behave..."
                              className="min-h-[120px] resize-none focus-visible:ring-2 focus-visible:ring-primary/50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Define the tone, role, and constraints of your agent.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="urls"
                      render={({ field }) => {
                        const urls = field.value || [];

                        const addUrl = () => {
                          field.onChange([...urls, '']);
                        };

                        const removeUrl = (index: number) => {
                          const newUrls = urls.filter((_, i) => i !== index);
                          field.onChange(newUrls);
                        };

                        const updateUrl = (index: number, value: string) => {
                          const newUrls = [...urls];
                          newUrls[index] = value;
                          field.onChange(newUrls);
                        };

                        return (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Knowledge Base</FormLabel>
                            <div className="space-y-3">
                              {urls.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic">
                                  No URLs added yet. Click + to add URLs.
                                </div>
                              ) : (
                                urls.map((url: string, index: number) => (
                                  <div key={index} className="flex gap-2">
                                    <FormControl>
                                      <Input
                                        placeholder="https://example.com/sitemap.xml"
                                        className="font-mono text-sm focus-visible:ring-2 focus-visible:ring-primary/50"
                                        value={url}
                                        onChange={(e) => updateUrl(index, e.target.value)}
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => removeUrl(index)}
                                      className="shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addUrl}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add URL
                              </Button>
                            </div>
                            <FormDescription>
                              Add sitemap.xml or individual URLs to train your agent.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Custom API Keys Section */}
                <div className="border-t pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Custom API Keys (Optional)</h3>
                    <p className="text-sm text-muted-foreground">Provide your own API keys or leave empty to use our platform keys.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="geminiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gemini API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Your Gemini key"
                              className="font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="anthropicApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Claude API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Your Claude key"
                              className="font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="openaiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OpenAI API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Your OpenAI key"
                              className="font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

              </form>
            </Form>
          </ModalContent>
          <ModalFooter className="gap-4 border-t pt-4">
            <button
              className="px-6 py-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span> Creating...
                </>
              ) : (
                <>
                  <span>✨</span> Create Agent
                </>
              )}
            </button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </div>
  )
}