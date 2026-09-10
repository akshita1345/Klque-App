import { NextResponse } from 'next/server';
import { checkAndTriggerCreditAlerts } from '@/server/services/openrouter.service';
import dbConnect from '@/utils/dbConnect';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Connect to database first
    await dbConnect();

    const result = await checkAndTriggerCreditAlerts();

    return NextResponse.json({
      success: true,
      message: "Credit alert check completed",
      data: result
    });
  } catch (error: any) {
    console.error("Error in test-credit-alerts handler:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}
