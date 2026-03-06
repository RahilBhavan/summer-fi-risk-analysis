import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Clock, FileCode } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SLUG_TO_PATH: Record<string, string> = {
  'consulting-report': '../CONSULTING_REPORT.md',
  'root-readme': '../README.md',
  'project-oversight': '../PROJECT_OVERSIGHT.md',
  'backtest-report': '../reports/backtest_report_aug5.md',
  'web-showcase-readme': 'README.md',
};

export default async function DocDetail({ params }: PageProps) {
  const { slug } = await params;
  const filePath = SLUG_TO_PATH[slug];

  if (!filePath) {
    return notFound();
  }

  const absolutePath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    return notFound();
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  const stats = fs.statSync(absolutePath);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/docs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--foreground)', opacity: 0.5, marginBottom: '4rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <ArrowLeft size={16} /> Back to Documents
        </Link>

        <header style={{ marginBottom: '4rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', opacity: 0.4, marginBottom: '1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileCode size={12} /> {slug}.md</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={12} /> Last updated: {stats.mtime.toLocaleDateString()}</span>
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textTransform: 'none' }}>{slug.replace(/-/g, ' ').toUpperCase()}</h1>
        </header>

        <article className="markdown-body" style={{ background: 'transparent' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
