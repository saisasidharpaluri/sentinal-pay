import { NextResponse } from 'next/server';
import { getVelocityConfig, updateVelocityConfig, getVelocityStats, resetVelocityLedger } from '@/lib/guardrails';

export async function GET() {
  return NextResponse.json({
    config: getVelocityConfig(),
    stats: getVelocityStats(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'reset_velocity') {
      resetVelocityLedger();
      return NextResponse.json({
        success: true,
        message: 'Velocity window reset',
        stats: getVelocityStats(),
        config: getVelocityConfig(),
      });
    }

    if (body.config) {
      const updated = updateVelocityConfig(body.config);
      return NextResponse.json({
        success: true,
        config: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
