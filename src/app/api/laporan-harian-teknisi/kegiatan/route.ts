import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profesiId = searchParams.get('profesiId');

    if (!profesiId) {
      return NextResponse.json({
        success: false,
        message: 'ProfesiId is required'
      }, { status: 400 });
    }

    // Get data for specific profesi
    const query = `
      SELECT * 
      FROM Teknik_TVRI.dbo.LaporanHarianTeknisi_Kegiatan 
      WHERE ProfesiId = ${profesiId}
    `;

    const result = await executeQuery(query);

    // Group by TahapanProduksi using correct column names
    const groupedData = result.reduce((acc: any, item: any) => {
      // Use correct column names from database
      const tahapanProduksi = item.TahapanProduksi || 'LAINNYA';
      const kegiatan = item.Kegiatan || 'Unknown';
      
      // Create section mapping
      let sectionKey = '';
      switch (tahapanProduksi) {
        case 'PRA PRODUKSI':
          sectionKey = 'PRA PRODUKSI';
          break;
        case 'PRODUKSI':
          sectionKey = 'PRODUKSI';
          break;
        case 'PASCA PRODUKSI':
          sectionKey = 'PASCA PRODUKSI';
          break;
        default:
          sectionKey = 'LAINNYA';
      }
      
      if (!acc[sectionKey]) {
        acc[sectionKey] = [];
      }
      
      // Add item with correct structure
      acc[sectionKey].push({
        Id: item.Id,
        NamaKegiatan: kegiatan,
        TahapanProduksi: tahapanProduksi
      });
      
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: groupedData
    });
  } catch (error: any) {
    console.error('Error fetching kegiatan data:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data kegiatan',
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
