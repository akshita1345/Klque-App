/****************************************************
 * MONGO LOG COLLECTION MODEL
 * Defines fields of PaymentLogs
****************************************************/
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const PaymentLog = new mongoose.Schema({
    operationName: { type: String },
    query: { type: String },
    response: { type: String },
    Error: { type: String },
    status: { type: String },
    type: { type: String },
}, { timestamps: true });

PaymentLog.plugin(mongoosePaginate);

// Define paymentlogs model if it hasn't been defined yet
const PaymentLogs = mongoose.models.paymentlogs || mongoose.model('paymentlogs', PaymentLog);

export { PaymentLogs };