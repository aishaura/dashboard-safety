import { NextRequest, NextResponse } from 'next/server';
import { SafetyDB } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const event = SafetyDB.getEventById(params.id);
  if (!event) {
    return NextResponse.json(
      { success: false, error: 'Event not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, event });
}
