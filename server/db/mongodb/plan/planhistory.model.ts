/****************************************************
 * MONGO PAYMENT HISTORY  COLLECTION MODEL
 * Defines fields of PaymentLogs
****************************************************/
import mongoose from 'mongoose';
let ObjectId = mongoose.Schema.Types.ObjectId;

const PaymentHistorySchema = new mongoose.Schema(
    {
        email: String,
        userId: ObjectId,
        planId: String,
        planPrice: String,
        expiryDate: Date,
        subscriptiondata: [Object],
    },
    { strict: false, timestamps: true },
)

// Define PaymentHistory model if it hasn't been defined yet
const PaymentHistory = mongoose.models.PaymentHistory || mongoose.model('PaymentHistory', PaymentHistorySchema);

export { PaymentHistory };