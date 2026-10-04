import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ComboProduct from '@/models/ComboProduct';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !(['admin', 'super_admin', 'manager'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const query: any = {};
    if (category) {
      query.category = category;
    }

    const items = await ComboProduct.find(query).sort({ sortOrder: 1, createdAt: -1 });
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error fetching combo products:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !(['admin', 'super_admin', 'manager'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      category,
      name,
      productKind,
      price,
      salePrice,
      colorName,
      colorHex,
      imageUrl,
      sizeStock,
      isActive,
      sortOrder,
      description,
    } = body;

    if (!category || !name) {
      return NextResponse.json({ message: 'Category and name are required' }, { status: 400 });
    }

    const created = await ComboProduct.create({
      category,
      name,
      productKind: productKind || 'combo',
      price: price ? Number(price) : 0,
      salePrice: salePrice ? Number(salePrice) : undefined,
      colorName: colorName || '',
      colorHex: colorHex || '',
      imageUrl: imageUrl || '',
      sizeStock: Array.isArray(sizeStock) ? sizeStock : [],
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      description: description || '',
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating combo product:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
