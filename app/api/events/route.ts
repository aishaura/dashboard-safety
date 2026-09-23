import { NextRequest, NextResponse } from 'next/server';
import { SafetyDB, EventFilterOptions } from '@/lib/db';
import { parseSearchQuery } from '@/lib/search-parser';
import { SafetyEvent } from '@/types/safety';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  const filter: EventFilterOptions = {};

  if (q) {
    const parsed = parseSearchQuery(q);
    if (parsed.category) filter.category = parsed.category;
    if (parsed.location) filter.location = parsed.location;
    if (parsed.severity) filter.severity = parsed.severity;
    if (parsed.year) filter.year = parsed.year;
    if (parsed.month) filter.month = parsed.month;
    if (!parsed.category && !parsed.location) {
      filter.search = q;
    }
  }

  // Explicit param overrides
  const category = searchParams.get('category');
  if (category && category !== 'ALL') filter.category = category as any;

  const severity = searchParams.get('severity');
  if (severity && severity !== 'ALL') filter.severity = severity as any;

  const status = searchParams.get('status');
  if (status && status !== 'ALL') filter.status = status as any;

  const temporalStatus = searchParams.get('temporalStatus');
  if (temporalStatus && temporalStatus !== 'ALL') filter.temporalStatus = temporalStatus as any;

  const location = searchParams.get('location');
  if (location) filter.location = location;

  const search = searchParams.get('search');
  if (search) filter.search = search;

  const year = searchParams.get('year');
  if (year) filter.year = parseInt(year, 10);

  const month = searchParams.get('month');
  if (month) filter.month = parseInt(month, 10);

  const limit = searchParams.get('limit');
  if (limit) filter.limit = parseInt(limit, 10);

  const offset = searchParams.get('offset');
  if (offset) filter.offset = parseInt(offset, 10);

  const result = SafetyDB.getEvents(filter);
  const stats = SafetyDB.getStats();

  return NextResponse.json({
    success: true,
    total: result.total,
    count: result.events.length,
    events: result.events,
    stats,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.category || !body.latitude || !body.longitude) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, category, latitude, longitude' },
        { status: 400 }
      );
    }

    const newEvent: SafetyEvent = {
      id: body.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fingerprint:
        body.fingerprint ||
        `custom-${body.category}-${body.latitude.toFixed(2)}-${body.longitude.toFixed(2)}-${Date.now()}`,
      title: body.title,
      description: body.description || '',
      category: body.category,
      subcategory: body.subcategory,
      severity: body.severity || 'MEDIUM',
      status: body.status || 'ACTIVE',
      temporalStatus: body.temporalStatus || 'VERIFIED_REPORT',
      sourceName: body.sourceName || 'Laporan Pengguna Terverifikasi',
      sourceUrl: body.sourceUrl,
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
      locationName: body.locationName || 'Lokasi Kejadian',
      district: body.district,
      regencyCity: body.regencyCity || 'Indonesia',
      province: body.province || 'Jawa Barat',
      occurredAt: body.occurredAt || new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      periodLabel: body.periodLabel || 'Sep 2026',
      casualtiesFatal: body.casualtiesFatal || 0,
      casualtiesInjured: body.casualtiesInjured || 0,
      impactSummary: body.impactSummary,
      metadata: body.metadata || {},
    };

    const result = SafetyDB.upsertEvents([newEvent]);

    return NextResponse.json({
      success: true,
      message: 'Incident successfully ingested into safety ledger',
      event: newEvent,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
