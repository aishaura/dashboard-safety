import { NextRequest, NextResponse } from 'next/server';
import { SafetyDB } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const profile = SafetyDB.getRegionProfile(params.slug);
  if (!profile) {
    return NextResponse.json(
      { success: false, error: `Region profile not found for ${params.slug}` },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, profile });
}
