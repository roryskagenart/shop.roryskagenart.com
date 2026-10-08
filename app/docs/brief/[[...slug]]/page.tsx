import { DocsLayout } from 'components/docs/docs-layout';
import { getDocPage } from 'lib/docs-content';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved.slug && resolved.slug.length > 0 ? resolved.slug[0]! : 'overview';
  const doc = getDocPage('brief', slug);

  return {
    title: doc ? `${doc.title} | Master Brief` : 'Master Brief | Rory Skagen Art',
    description:
      doc?.description ||
      'The consolidated client IP, project, and reference brief for the Rory Skagen engagement.'
  };
}

export default async function BriefDocsPage({ params }: PageProps) {
  const resolved = await params;
  const slug = resolved.slug && resolved.slug.length > 0 ? resolved.slug[0]! : 'overview';
  const doc = getDocPage('brief', slug);

  return <DocsLayout currentScope="brief" currentSlug={slug} doc={doc} />;
}
