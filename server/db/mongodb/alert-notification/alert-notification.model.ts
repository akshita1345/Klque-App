import mongoose, { Schema, Document } from "mongoose";

export type AlertType =
  | "WARNING"
  | "CRITICAL"
  | "INCIDENT"
  | "RUNTIME_ERROR";

export interface AlertNotificationDocument extends Document {
  alertType: AlertType;
  totalCredit: number;
  totalUsage: number;
  lastEmailSentAt?: Date;
}

const AlertNotificationSchema = new Schema<AlertNotificationDocument>(
  {
    alertType: {
      type: String,
      enum: ["WARNING", "CRITICAL", "INCIDENT", "RUNTIME_ERROR"],
      required: true
    },
    totalCredit: {
      type: Number,
      default: 0
    },
    totalUsage: {
      type: Number,
      default: 0
    },
    lastEmailSentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// DEFINE ALERT NOTIFICATION MODEL IF IT HASN'T BEEN DEFINED YET
const AlertNotification = mongoose?.models?.alertnotifications || mongoose.model<AlertNotificationDocument>(
  "alertnotifications",
  AlertNotificationSchema
);

export { AlertNotification };
