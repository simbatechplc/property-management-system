"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function ChatBotContainer() {
  const [selectedLanguage, setSelectedLanguage] = useState<"am" | "en">("en");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm Kuru Rent AI Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendToChatbot = useMutation({
    mutationFn: async (input: string) => {
      const chatMessages = messages.map((m) => ({
        role: m.sender === "bot" ? "ASSISTANT" : "USER",
        content: m.text,
      }));

      const ADMIN_URL = "https://property-management-system-s61h.vercel.app";
      const res = await fetch(`${ADMIN_URL}/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, message: input, lang: selectedLanguage }),
      });
      return res.json() as Promise<{ reply: string; success: boolean }>;
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "I'm a bit busy right now. Please try again in a moment.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    },
    onSuccess: (res: any) => {
      let replyText = "Sorry, I couldn't understand that.";

      if (typeof res === "string") {
        replyText = res;
      } else if (res && typeof res === "object") {
        replyText = res.reply || res.message || res.data?.reply || replyText;
      }

      const botMessage: Message = {
        id: Date.now(),
        text: replyText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    },
  });

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // 🧠 Disable page scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendToChatbot.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSendMessage();
  };

  return (
    <>
      {/* Floating AI Button — rendered inside FloatingActions in layout */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        <span className="sr-only">Toggle AI assistant</span>
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="overflow-hidden fixed pt-0 bottom-36 right-6 w-[90vw] md:w-[380px] h-[70dvh] md:h-[500px] shadow-2xl z-50 flex flex-col border-border">
          <CardHeader className="border-b pt-4 bg-primary text-primary-foreground">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-foreground/20">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Kuru Rent AI</CardTitle>
                  <p className="text-xs text-primary-foreground/80">AI operations helper</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex gap-2", message.sender === "user" ? "justify-end" : "justify-start")}>
                {message.sender === "bot" && (
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn("max-w-[75%] rounded-lg px-4 py-2",
                  message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.sender === "user" && (
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {sendToChatbot.isPending && <p className="text-sm text-gray-500 italic text-left">AI is thinking...</p>}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="border-t p-4">
            <div className="flex w-full gap-2">
              <Button className="py-6 px-6 uppercase" variant="outline" size="icon"
                onClick={() => setSelectedLanguage(l => l === "am" ? "en" : "am")}>
                {selectedLanguage}
              </Button>
              <Input placeholder="Ask about bookings, reports, or staff tasks..."
                value={inputValue} onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress} disabled={sendToChatbot.isPending} className="flex-1 py-6" />
              <Button onClick={handleSendMessage} size="icon" disabled={sendToChatbot.isPending} className="py-6 px-6">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
