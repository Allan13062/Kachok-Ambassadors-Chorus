import app from "../server.ts";

// This exports our Express app for Vercel's Serverless Function engine
export default app;
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { mpesaTransactions } from '../src/db/schema';

// This function receives the payment results from Safaricom M-Pesa
export const handleMpesaCallback = async (req: any, res: any) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      return res.status(400).send("No callback data found");
    }

    const callbackData = Body.stkCallback;
    const checkoutRequestID = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;

    let receiptNumber: string | null = null;
    let transactionStatus = 'FAILED';

    // ResultCode 0 means the transaction was successful
    if (resultCode === 0) {
      transactionStatus = 'SUCCESS';
      const items = callbackData.CallbackMetadata.Item;
      const mpesaReceiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
      receiptNumber = mpesaReceiptItem ? mpesaReceiptItem.Value : null;
    }

    // Update the transaction status in your PostgreSQL database
    await db.update(mpesaTransactions)
      .set({
        status: transactionStatus,
        resultCode: resultCode,
        resultDesc: resultDesc,
        mpesaReceiptNumber: receiptNumber,
        updatedAt: new Date()
      })
      .where(eq(mpesaTransactions.checkoutRequestId, checkoutRequestID));

    // Send a success message back to Safaricom
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("Mpesa callback save error:", error);
    return res.status(500).send("Internal Server Error");
  }
};
