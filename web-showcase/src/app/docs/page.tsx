import Link from 'next/link';
import { FileText, ArrowLeft, Briefcase, Target, Info } from 'lucide-react';

export default function DocsPage() {
  const docs = [
    {
      title: 'Project Overview',
      slug: 'root-readme',
      description: 'The main project description and execution guide.',
      icon: <FileText size={20} />
    },
    {
      title: 'Project Oversight',
      slug: 'project-oversight',
      description: 'Strategic objectives and high-level architectural oversight.',
      icon: <Target size={20} />
    },
    {
      title: 'Backtest Report (Aug 5)',
      slug: 'backtest-report',
      description: 'Granular results from the August 5th crash simulation.',
      icon: <Info size={20} />
    },
    {
      title: 'Web Showcase Guide',
      slug: 'web-showcase-readme',
      description: 'Documentation for this visualization platform.',
      icon: <Briefcase size={20} />
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--foreground)', opacity: 0.5, marginBottom: '4rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <ArrowLeft size={16} /> Back to Showcase
        </Link>

        <header style={{ marginBottom: '6rem' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '2rem' }}>Technical Documentation</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.7, lineHeight: '1.6', maxWidth: '700px' }}>
            A comprehensive repository of the research, strategy, and engineering logic behind the Summer.fi Dynamic Risk Analysis project.
          </p>
        </header>

        {/* Project Context Section */}
        <section style={{ marginBottom: '6rem', padding: '4rem', border: '1px solid var(--border)', background: '#fff' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>Project Context</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div>
              <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '1rem' }}>WHO</h3>
              <p style={{ opacity: 0.8 }}>Summer.fi Risk Research Team. A collaborative effort to enhance DeFi automation safety.</p>
            </div>
            <div>
              <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '1rem' }}>WHERE</h3>
              <p style={{ opacity: 0.8 }}>Aave V3 & Morpho Blue. Investigating protocol-specific liquidation thresholds on Ethereum.</p>
            </div>
            <div>
              <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '1rem' }}>WHY</h3>
              <p style={{ opacity: 0.8 }}>To solve the "Gas Paradox" where safety triggers fail during peak network congestion and price velocity spikes.</p>
            </div>
            <div>
              <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '1rem' }}>HOW</h3>
              <p style={{ opacity: 0.8 }}>Using a custom-built simulation engine that integrates historical 1-minute price data with real-time Etherscan gas fees.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Project Files</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {docs.map((doc) => (
              <Link 
                key={doc.slug} 
                href={`/docs/${doc.slug}`}
                className="doc-link-card"
              >
                <div style={{ padding: '1rem', background: 'var(--glass)', borderRadius: '4px' }}>
                  {doc.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', textTransform: 'none' }}>{doc.title}</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{doc.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer style={{ marginTop: '8rem', padding: '4rem 0', borderTop: '1px solid var(--border)', opacity: 0.5 }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>© 2026 SUMMER.FI RISK ANALYSIS - CONFIDENTIAL TECHNICAL OVERVIEW</p>
        </footer>
      </div>
    </div>
  );
}
