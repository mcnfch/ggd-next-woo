import { NextResponse } from 'next/server';
import { generateSitemapIndex } from '../../../utils/generate-sitemaps.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const xml = await generateSitemapIndex();

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new NextResponse('Error generating sitemap', { 
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}
