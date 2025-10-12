"use client";

import Image from "next/image";
import Link from "next/link";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030303] text-white">

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur supports-[backdrop-filter]:bg-black/20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 text-white">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/simplyphiLogo.png" width={40} height={40} alt="SimplyPhi" className="rounded-sm" />
            <span className="text-base md:text-lg font-semibold tracking-tight">SimplyPhi</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#how" className="text-sm text-white/70 hover:text-white">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/signin">
              <Button variant="ghost" className="hidden md:inline-flex text-white hover:bg-white/10 hover:text-white cursor-pointer">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 hover:text-black cursor-pointer">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>


      <main className="flex-1 pt-24">
        
        <section className="mx-auto max-w-none px-0">
          <HeroGeometric
            badge="Real Estate RAG"
            title1="AI-Powered"
            title2="Real Estate Insights"
          />
        </section>
        <footer className="mx-auto mt-24 w-full max-w-6xl border-t border-white/10 px-4 py-6 text-xs text-white/60">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <span>By Rohit Saluja</span>
            <div className="flex items-center gap-4">
              <a href="#how" className="hover:text-white">How it works</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
