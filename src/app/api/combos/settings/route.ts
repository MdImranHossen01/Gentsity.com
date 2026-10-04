import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OfferSettings from '@/models/OfferSettings';
import { auth } from '@/auth';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await OfferSettings.findOne().lean();
    if (!settings) {
      settings = await OfferSettings.create({});
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching offer settings:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    let settings = await OfferSettings.findOne();
    if (!settings) {
      settings = new OfferSettings(body);
    } else {
      Object.assign(settings, body);
    }
    await settings.save();

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error updating offer settings:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
