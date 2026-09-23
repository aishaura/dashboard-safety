import { NextResponse } from 'next/server';
import { generateSafetyInsights } from '@/lib/insights';

export async function GET() {
  const insights = generateSafetyInsights();
  return NextResponse.json({
    success: true,
    total: insights.length,
    insights,
  });
}
