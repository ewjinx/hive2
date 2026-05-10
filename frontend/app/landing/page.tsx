import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Network, Server, Shield, Zap, Globe, Cpu, ArrowRight, ChevronRight, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="dark bg-background text-foreground min-h-screen font-sans selection:bg-primary selection:text-black overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/10 blur-[100px] rounded-full mix-blend-screen" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-border/40 bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/hive_logo.png" alt="Hive Logo" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-heading font-bold text-xl tracking-tight text-white">Hive</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#network" className="text-sm font-medium text-muted-foreground hover:text-white grass-transition">Network</Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-white grass-transition">Features</Link>
            <Link href="#nodes" className="text-sm font-medium text-muted-foreground hover:text-white grass-transition">Nodes</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-white hover:text-primary grass-transition hidden sm:block">
              Login
            </Link>
            <Link href="/dashboard" className="grass-btn bg-primary text-black px-6 py-2.5 hover:bg-primary-hover hover:grass-glow">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="pt-32 pb-24 px-6 relative">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 grass-glow">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Hive Network is Live
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
              The Decentralized <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Compute Grid</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12">
              Join the distributed network of intelligence. Provide compute, run agents securely, and earn rewards on the most scalable grid platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/download" className="grass-btn bg-primary text-black px-8 py-4 w-full sm:w-auto text-lg hover:bg-primary-hover hover:grass-glow flex items-center justify-center gap-2">
                Download Node <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/docs" className="grass-btn bg-transparent border border-border text-white px-8 py-4 w-full sm:w-auto text-lg hover:bg-card hover:border-primary/50 flex items-center justify-center gap-2">
                Read the Docs
              </Link>
            </div>
          </div>
          
          {/* Abstract Hero Image/Graphic */}
          <div className="mt-24 max-w-5xl mx-auto relative">
            <div className="aspect-[21/9] rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden relative grass-glow">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simulated Nodes Graphic */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-[600px] h-[600px] border border-primary/20 rounded-full absolute animate-[spin_60s_linear_infinite]" />
                  <div className="w-[400px] h-[400px] border border-primary/40 rounded-full absolute animate-[spin_40s_linear_reverse_infinite]" />
                  <div className="w-[200px] h-[200px] border border-primary/60 rounded-full absolute animate-[spin_20s_linear_infinite] grass-glow" />
                  <div className="w-24 h-24 bg-primary/10 rounded-full absolute backdrop-blur-md border border-primary/50 flex items-center justify-center grass-glow">
                    <Image src="/hive_logo.png" alt="Hive Node" width={48} height={48} className="w-12 h-12 object-contain animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border/40 bg-card/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/40">
              <div className="text-center">
                <p className="text-4xl font-heading font-bold text-white mb-2">2.4M+</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Nodes</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-heading font-bold text-white mb-2">150k</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Daily Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-heading font-bold text-white mb-2">99.9%</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-heading font-bold text-white mb-2">~0.2s</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Avg Latency</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6">Built for the future of AI</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Hive is designed from the ground up to provide secure, verifiable, and extremely fast compute for AI agents.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Network className="w-8 h-8 text-primary" />,
                  title: "Global Distribution",
                  desc: "Tap into a worldwide network of GPUs and CPUs. Run tasks closer to your data for lower latency."
                },
                {
                  icon: <Shield className="w-8 h-8 text-primary" />,
                  title: "Verifiable Compute",
                  desc: "Zero-knowledge proofs ensure that the computation was performed correctly without compromising data privacy."
                },
                {
                  icon: <Cpu className="w-8 h-8 text-primary" />,
                  title: "Hardware Agnostic",
                  desc: "From consumer GPUs to enterprise clusters, Hive seamlessly schedules workloads across diverse hardware."
                },
                {
                  icon: <Server className="w-8 h-8 text-primary" />,
                  title: "Resilient Infrastructure",
                  desc: "Self-healing network architecture ensures your workloads complete even if nodes go offline."
                },
                {
                  icon: <Zap className="w-8 h-8 text-primary" />,
                  title: "Instant Provisioning",
                  desc: "Forget waiting for cold starts. Hive nodes are always warm and ready to execute your agents instantly."
                },
                {
                  icon: <Globe className="w-8 h-8 text-primary" />,
                  title: "Decentralized Economy",
                  desc: "Earn rewards for contributing your idle compute, or spend to accelerate your AI research."
                }
              ].map((feature, i) => (
                <div key={i} className="grass-card p-8 group hover:grass-glow grass-transition relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 border border-primary/20 group-hover:border-primary/50 grass-transition">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="max-w-4xl mx-auto text-center relative z-10 grass-card p-12 md:p-20 border-primary/20 grass-glow">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">Ready to join the Hive?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Start contributing compute power today and become a part of the most powerful decentralized network.
            </p>
            <Link href="/signup" className="grass-btn bg-primary text-black px-10 py-5 text-lg hover:bg-primary-hover hover:grass-glow inline-flex items-center gap-2">
              Get Started Now <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background pt-16 pb-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Image src="/hive_logo.png" alt="Hive Logo" width={24} height={24} className="w-6 h-6 object-contain" />
              <span className="font-heading font-bold text-lg text-white">Hive</span>
            </div>
            <p className="text-muted-foreground text-sm">
              The compute layer for the next generation of artificial intelligence.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary grass-transition">Network</Link></li>
              <li><Link href="#" className="hover:text-primary grass-transition">Download Node</Link></li>
              <li><Link href="#" className="hover:text-primary grass-transition">Explorer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Developers</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary grass-transition">Documentation</Link></li>
              <li><Link href="#" className="hover:text-primary grass-transition">API Reference</Link></li>
              <li><Link href="#" className="hover:text-primary grass-transition">GitHub</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary grass-transition">About</Link></li>
              <li><Link href="#" className="hover:text-primary grass-transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary grass-transition">Careers</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Hive Network. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary grass-transition">Twitter</Link>
            <Link href="#" className="hover:text-primary grass-transition">Discord</Link>
            <Link href="#" className="hover:text-primary grass-transition">Terms</Link>
            <Link href="#" className="hover:text-primary grass-transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
