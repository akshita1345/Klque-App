/****************************************************
 * MONGO SESSION COLLECTION MODEL
 * Defines fields of SESSION
 ****************************************************/
import mongoose from "mongoose";

let ObjectId = mongoose.Schema.Types.ObjectId;

const SessionSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
        },
        type: {
            type: String,
        },
        emailCounter: {
            type: Number
        },
        userId: {
            type: ObjectId,
            ref: "user",
        },
    },
    { timestamps: true }
);
SessionSchema.index({ createdAt: 1 }, { expires: "24h" });


// Define PaymentHistory model if it hasn't been defined yet
const Session = mongoose.models.session || mongoose.model("session", SessionSchema);

export { Session };