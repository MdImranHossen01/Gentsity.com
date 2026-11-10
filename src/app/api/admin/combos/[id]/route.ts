import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ComboProduct from '@/models/ComboProduct';
import { auth } from '@/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user || !(['admin', 'super_admin', 'manager'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const updated = await ComboProduct.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Error updating combo item:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user || !(['admin', 'super_admin', 'manager'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const deleted = await ComboProduct.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    try {
      const imagesToDelete = [(deleted as any).image, (deleted as any).thumbnail].filter(Boolean);
      if (imagesToDelete.length > 0) {
        const { deleteMultipleFromR2 } = await import('@/lib/r2');
        await deleteMultipleFromR2(imagesToDelete);
      }
      const { purgeCloudflareCache } = await import('@/lib/cloudflareCache');
      await purgeCloudflareCache();
    } catch (cleanErr) {
      console.error('Failed to clean combo product images from R2:', cleanErr);
    }

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    console.error('Error deleting combo item:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
