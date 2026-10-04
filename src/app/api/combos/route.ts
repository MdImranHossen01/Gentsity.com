import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ComboProduct from '@/models/ComboProduct';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category'); // 'polo' | 'pajama' | 'sneakers'

    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }

    const items = await ComboProduct.find(query)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Error fetching public combo products:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
