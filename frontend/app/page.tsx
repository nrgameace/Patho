"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Waves from "@/components/ui/waves";
import ScrollReveal from "@/components/ui/scroll-reveal";
import BlurText from "@/components/ui/blur-text";
import ShinyText from "@/components/ui/shiny-text";
import { Activity, GitCompare, FlaskConical, ChevronRight, Play, ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Fixed Waves Background */}
      <div className="fixed inset-0 z-0">
        <Waves
          lineColor="rgba(230, 57, 70, 0.15)"
          backgroundColor="#03070f"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          xGap={12}
          yGap={36}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 w-full">
          <div className="glass-card px-6 py-4 mx-4 mt-4 rounded-2xl">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="font-mono font-bold text-xl text-primary tracking-tight">
                PATHOGEN
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#data" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Data
                </a>
                <a href="#models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Models
                </a>
                <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Docs
                </a>
              </div>
              <Link href="/dashboard" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition-all">
                Launch App
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section - Full Screen Title Only */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8">
              <BlurText
                text="Track. Predict."
                delay={150}
                animateBy="words"
                direction="top"
                className="font-mono font-bold text-5xl md:text-7xl lg:text-[8rem] tracking-tight text-foreground justify-center"
                stepDuration={0.4}
              />
              <motion.div
                className="font-mono font-bold text-5xl md:text-7xl lg:text-[8rem] tracking-tight"
                initial={{ filter: "blur(10px)", opacity: 0, y: -50 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              >
                <ShinyText
                  text="Contain."
                  color="#e63946"
                  shineColor="#ff8a8a"
                  speed={3}
                  className="font-mono font-bold"
                />
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 fade-in-up" style={{ animationDelay: "0.5s" }}>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground animate-bounce" />
          </div>
        </section>

        {/* Description Section - Scroll Reveal */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal containerClassName="mb-16">
              <h2 className="font-mono text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                AI-powered disease spread simulation trained on real CDC outbreak data
              </h2>
            </ScrollReveal>
          </div>
        </section>

        {/* Stats Section - Scroll Reveal */}
        <section id="data" className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <div className="max-w-4xl mx-auto mb-16">
            <ScrollReveal containerClassName="mb-8">
              <h2 className="font-mono text-2xl md:text-4xl font-bold text-foreground leading-tight text-center">
                Built on real CDC surveillance data across every US county
              </h2>
            </ScrollReveal>
          </div>

          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <ScrollReveal delay={0}>
                <div className="glass-card rounded-xl p-6 text-center">
                  <div className="font-mono font-bold text-3xl md:text-4xl text-foreground mb-2">
                    3,142
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                    Counties Covered
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <div className="glass-card rounded-xl p-6 text-center">
                  <div className="font-mono font-bold text-3xl md:text-4xl text-foreground mb-2">
                    424K+
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                    Flight Routes Analyzed
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <div className="glass-card rounded-xl p-6 text-center">
                  <div className="font-mono font-bold text-3xl md:text-4xl text-foreground mb-2">
                    51
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                    States & Territories
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
                <div className="glass-card rounded-xl p-6 text-center">
                  <div className="font-mono font-bold text-3xl md:text-4xl text-foreground mb-2">
                    2020–27
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                    Timeline Coverage
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* How It Works Section - Scroll Reveal */}
        <section id="features" className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <div className="max-w-4xl mx-auto mb-16">
            <ScrollReveal containerClassName="mb-8">
              <h2 className="font-mono text-2xl md:text-4xl font-bold text-foreground leading-tight text-center">
                Visualize, compare, and model disease outbreaks with precision
              </h2>
            </ScrollReveal>
          </div>

          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Time-lapse Simulation */}
              <ScrollReveal delay={0}>
                <div className="glass-card rounded-2xl p-8 group hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <Activity className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-mono font-bold text-xl mb-3 text-foreground">
                    Time-lapse Simulation
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Watch disease spread patterns unfold over time with our
                    real-time visualization engine. Scrub through weeks, months, or
                    years of outbreak data.
                  </p>
                </div>
              </ScrollReveal>

              {/* Side-by-side Comparison */}
              <ScrollReveal delay={0.15}>
                <div className="glass-card rounded-2xl p-8 group hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <GitCompare className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-mono font-bold text-xl mb-3 text-foreground">
                    Side-by-side Comparison
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Compare multiple outbreak scenarios simultaneously. Analyze
                    intervention strategies and their impact on transmission rates.
                  </p>
                </div>
              </ScrollReveal>

              {/* Scenario Modeling */}
              <ScrollReveal delay={0.3}>
                <div className="glass-card rounded-2xl p-8 group hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <FlaskConical className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-mono font-bold text-xl mb-3 text-foreground">
                    Scenario Modeling
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Build custom scenarios with adjustable parameters. Test
                    vaccination rates, social distancing measures, and containment
                    protocols.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* CTA Section - Scroll Reveal */}
        <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal containerClassName="mb-12">
              <h2 className="font-mono text-2xl md:text-4xl font-bold text-foreground leading-tight text-center">
                Ready to predict the next outbreak before it happens?
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl text-base font-medium transition-all w-full sm:w-auto justify-center">
                  Open Dashboard
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <button className="flex items-center gap-2 glass-button px-8 py-4 rounded-xl text-base font-medium transition-all w-full sm:w-auto justify-center text-foreground">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-border/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-mono font-bold text-lg text-primary">
              PATHOGEN
            </div>
            <div className="text-sm text-muted-foreground">
              Powered by CDC outbreak data and machine learning
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
