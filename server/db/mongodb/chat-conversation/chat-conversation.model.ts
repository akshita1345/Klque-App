import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ObjectId = mongoose.Schema.Types.ObjectId;

const ChatConversationSchema: any = new mongoose.Schema({
	userId: {
		type: ObjectId,
		ref: "users",
		index: true
	},
	historyId: {
		type: ObjectId,
		ref: "chathistory",
		index: true
	},
	message: {
		type: String,
		index: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
		index: true,
	},
	toolId: {
		type: String,
		index: true,
	},
	generatedScriptIds: {
		type: mongoose.Schema.Types.Mixed,
		default: []
	},
	generatedTasks: {
		type: [Object],
		default: []
	},
	isLiked: {
		type: Boolean,
		index: true
	},
	isFailed: {
		type: Boolean,
		default: false,
		index: true
	},
	isAddedToPlan: {
		type: Boolean,
		default: false,
		index: true
	},
	isIdeaScript: {
		type: Boolean,
		default: false,
		index: true
	},
	isQuestion: {
		type: Boolean,
		default: false,
		index: true
	},
	isAnswered: {
		type: Boolean,
		default: false,
		index: true
	},
	isDeleted: {
		type: Boolean,
		default: false,
		index: true
	}
}, { strict: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ADD PAGINATION //
ChatConversationSchema.plugin(mongoosePaginate);

// DEFINE CHAT CONVERSATION MODEL IF IT HASN'T BEEN DEFINED YET
const ChatConversation = mongoose.models.chatconversation || mongoose.model("chatconversation", ChatConversationSchema);

export { ChatConversation };
