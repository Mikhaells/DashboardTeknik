import { NextResponse } from 'next/server';
import { getShiftKerjaOptions } from '@/lib/dashboard';

export async function GET() {
  try {
    const shiftKerja = await getShiftKerjaOptions();
    
    return NextResponse.json({
      success: true,
      data: shiftKerja
    });
  } catch (error) {
    console.error('Error fetching shift kerja options:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch shift kerja options',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
