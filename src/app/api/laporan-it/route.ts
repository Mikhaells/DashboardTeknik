import { NextRequest, NextResponse } from 'next/server';
import { getLaporanIT } from '@/lib/laporan-it';
import { getUserSession } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const userLevel = searchParams.get('userLevel');
    const username = searchParams.get('username');

    const result = await getLaporanIT(page, limit, userLevel ? parseInt(userLevel) : undefined, username || undefined);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching laporan IT:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data laporan IT' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current user from session
    const currentUser = await getUserSession();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login first' },
        { status: 401 }
      );
    }

    const {
      Nama,
      NIP,
      JabatanId,
      EventDate,
      RingkasanKegiatan,
      IncidentReport,
      PlannedActivities,
      Feedback
    } = body;

    // Validate required fields
    if (!Nama || !NIP || !JabatanId || !EventDate || !RingkasanKegiatan || !IncidentReport || !PlannedActivities) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi kecuali Feedback' },
        { status: 400 }
      );
    }

    // Insert new laporan IT
    const insertQuery = `
      INSERT INTO Teknik_TVRI.dbo.LaporanIT (
        Nama, NIP, JabatanId, EventDate, RingkasanKegiatan, 
        IncidentReport, PlannedActivities, Feedback, StatusId, CreateBy
      )
      VALUES (
        @Nama, @NIP, @JabatanId, @EventDate, @RingkasanKegiatan, 
        @IncidentReport, @PlannedActivities, @Feedback, 1, @CreateBy
      )
    `;

    const pool = await getDbPool();
    await pool.request()
      .input('Nama', Nama)
      .input('NIP', NIP)
      .input('JabatanId', JabatanId)
      .input('EventDate', EventDate)
      .input('RingkasanKegiatan', RingkasanKegiatan)
      .input('IncidentReport', IncidentReport)
      .input('PlannedActivities', PlannedActivities)
      .input('Feedback', Feedback || '')
      .input('CreateBy', currentUser.username)
      .query(insertQuery);

    return NextResponse.json({
      success: true,
      message: 'Laporan IT berhasil ditambahkan'
    });

  } catch (error) {
    console.error('Error creating laporan IT:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menambahkan laporan IT' },
      { status: 500 }
    );
  }
}
