import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ObjectId = mongoose.Schema.Types.ObjectId;

const ChatHistorySchema: any = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "users",
        index: true
    },
    title: {
        type: String,
        index: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, { strict: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ADD PAGINATION //
ChatHistorySchema.plugin(mongoosePaginate);

// DEFINE CHAT HISTORY MODEL IF IT HASN'T BEEN DEFINED YET
const ChatHistory = mongoose.models.chathistory || mongoose.model("chathistory", ChatHistorySchema);

export { ChatHistory };
