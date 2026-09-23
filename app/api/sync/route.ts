import { NextRequest, NextResponse } from 'next/server';
import { runFullSync } from '@/lib/ingestion/orchestrator';
import { SafetyDB } from '@/lib/db';

export async function GET() {
  const syncLogs = SafetyDB.getSyncLogs();
  return NextResponse.json({
    success: true,
    lastSync: syncLogs.length > 0 ? syncLogs[0] : null,
    history: syncLogs,
  });
}

export async function POST() {
  try {
    const result = await runFullSync();
    return NextResponse.json({
      success: true,
      message: 'Synchronization cycle completed',
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
