"use client"

import {
  Building2,
  Shield,
  Users,
  Sparkles,
  Home,
  TrendingUp,
  Star,
  Award,
  Globe,
  Clock,
  ChevronDown,
} from "lucide-react"
import { RegistrationForm } from "../components/registration-form"
import { ChatBotContainer } from "@/components/chatbot"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useEffect, useRef, useState } from "react"

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("home")
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }))

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "features", "testimonials", "stats", "register"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const carouselImages = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
    "https://w0.peakpx.com/wallpaper/720/875/HD-wallpaper-luxury-hotel-glamorous-hotel-five-star-hotel-hotel.jpg",
    "https://ansainteriors.com/wp-content/uploads/2020/06/1-2-copy.jpg",
  ]

  const navItems = [
    { id: "home", label: "Home" },
    { id: "features", label: "Features" },
    { id: "testimonials", label: "Testimonials" },
    { id: "stats", label: "Stats" },
    { id: "register", label: "Register" },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1a4a2e]/30 bg-[#1a4a2e]">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary overflow-hidden">
              <img src="https://res.cloudinary.com/dmhsqmdbc/image/upload/v1776093694/bete_uploads/nvducfh9nbyixyatxrp9.jpg" alt="Kuru Rent" className="w-full h-full object-cover" />
            </div>
            <span
              className="text-xl font-bold text-[#c9a227]"
              style={{ textShadow: "0 1px 0 #8a6d0a, 0 2px 4px rgba(0,0,0,0.3)", transition: "transform 0.2s, text-shadow 0.2s", display: "inline-block" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = "perspective(200px) rotateX(8deg) scale(1.05)"; (e.target as HTMLElement).style.textShadow = "0 2px 0 #8a6d0a, 0 4px 8px rgba(0,0,0,0.4)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = ""; (e.target as HTMLElement).style.textShadow = "0 1px 0 #8a6d0a, 0 2px 4px rgba(0,0,0,0.3)"; }}
            >Kuru Rent</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === item.id
                    ? "bg-white/20 text-[#c9a227]"
                    : "text-[#c9a227]/80 hover:text-[#c9a227] hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-[#1a4a2e]/30 bg-[#1a4a2e]">
          <div className="container px-4 py-2 flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeSection === item.id
                    ? "bg-white/20 text-[#c9a227]"
                    : "text-[#c9a227]/80 hover:text-[#c9a227] hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Hero Section with Carousel */}
      <section id="home" className="relative overflow-hidden">
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {carouselImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative h-[500px] sm:h-[600px] lg:h-[700px]">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Luxury hotel ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="container px-4 sm:px-8 md:px-16">
                      <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 backdrop-blur px-4 py-2 text-sm shadow-sm">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-medium">Join 1,000+ Property Owners</span>
                        </div>

                        <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
                          List Your Property, <span className="text-primary">Grow Your Business</span>
                        </h1>

                        <p className="mb-8 text-lg text-muted-foreground text-pretty md:text-xl">
                          Connect with travelers worldwide and maximize your bookings. Our platform makes it easy to
                          manage your property and reach guests looking for authentic experiences.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                              <Shield className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <span className="font-medium">Verified Listings</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                              <Users className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <span className="font-medium">Global Reach</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                              <TrendingUp className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <span className="font-medium">Increase Revenue</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 sm:left-8" />
          <CarouselNext className="right-4 sm:right-8" />
        </Carousel>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b bg-muted/30 py-16 md:py-24 px-4 sm:px-8 md:px-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-balance md:text-4xl">Why Partner With Us?</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Everything you need to succeed in the hospitality industry
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Easy Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Intuitive dashboard to manage bookings, pricing, and availability in real-time
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                <img
                  src="https://ethiopianlogos.com/logos/chapa_no_text/chapa_no_text.png"
                  alt="Chapa"
                  className="w-[90px]"
                />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Secure Payments</h3>
              <p className="text-muted-foreground leading-relaxed">
                Fast, secure payment processing with fraud protection and instant payouts
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">24/7 Support</h3>
              <p className="text-muted-foreground leading-relaxed">
                Dedicated support team ready to help you and your guests anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 px-4 sm:px-8 md:px-16 border-b">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-balance md:text-4xl">What Our Partners Say</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Hear from property owners who have transformed their business with Kuru Rent
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                "Kuru Rent has completely transformed how I manage my properties. Bookings increased by 300% in just 3
                months!"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  SA
                </div>
                <div>
                  <p className="font-semibold">Sarah Anderson</p>
                  <p className="text-sm text-muted-foreground">Villa Owner, Bali</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                "The platform is incredibly easy to use. The payment system is seamless and I get paid on time, every
                time."
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  MJ
                </div>
                <div>
                  <p className="font-semibold">Michael Johnson</p>
                  <p className="text-sm text-muted-foreground">B&B Owner, London</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                "Best decision for my property business. The support team is amazing and always there when I need
                help."
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  EP
                </div>
                <div>
                  <p className="font-semibold">Elena Petrova</p>
                  <p className="text-sm text-muted-foreground">Hotel Owner, Greece</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="bg-muted/30 py-16 md:py-24 px-4 sm:px-8 md:px-16 border-b">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-balance md:text-4xl">Our Impact in Numbers</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Join thousands of successful property owners worldwide
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="mb-2 text-4xl font-bold">1,000+</div>
              <p className="text-muted-foreground">Active Properties</p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <div className="mb-2 text-4xl font-bold">50+</div>
              <p className="text-muted-foreground">Countries Served</p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="mb-2 text-4xl font-bold">98%</div>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="mb-2 text-4xl font-bold">24/7</div>
              <p className="text-muted-foreground">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="register" className="py-16 md:py-24 px-4 sm:px-8 md:px-16">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <RegistrationForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4 sm:px-8 md:px-16">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
                <img src="https://res.cloudinary.com/dmhsqmdbc/image/upload/v1776093694/bete_uploads/nvducfh9nbyixyatxrp9.jpg" alt="Kuru Rent" className="w-full h-full object-cover" />
              </div>
              <span
                className="font-bold"
                style={{ textShadow: "0 1px 0 #8a6d0a, 0 2px 4px rgba(0,0,0,0.3)", transition: "transform 0.2s", display: "inline-block" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.transform = "perspective(200px) rotateX(8deg) scale(1.05)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.transform = ""; }}
              >Kuru Rent</span>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Kuru Rent. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ChatBotContainer />
    </div>
  )
}
