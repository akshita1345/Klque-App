import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ObjectId = mongoose.Schema.Types.ObjectId;

const SearchHistorySchema: any = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "users",
        index: true
    },
    url: {
        type: String,
        index: true,
    },
    query: {
        type: String,
        index: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    tool: {
        type: String,
    },
    toolInput: {
        type: Object,
    },
    sources: {
        type: Array,
    },
    meta: {
        type: Object,
    },
    result: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, { strict: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ADD PAGINATION //
SearchHistorySchema.plugin(mongoosePaginate);

// DEFINE CHAT CONVERSATION MODEL IF IT HASN'T BEEN DEFINED YET
const SearchHistory = mongoose.models.searchhistory || mongoose.model("searchhistory", SearchHistorySchema);

export { SearchHistory };
