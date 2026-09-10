import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

let { ObjectId } = mongoose.Schema.Types;

const contentSchema: any = new mongoose.Schema({
	scriptId: {
		type: String,
		trim: true,
		index: true
	},
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
	ideaTitle: {
		type: String,
		trim: true,
		index: true
	},
	hook: {
		type: String,
		index: true,
		trim: true,
	},
	script: {
		type: String,
		trim: true,
		index: true
	},
	cta: {
		type: String,
		index: true,
		trim: true,
	},
	conclusion: {
		type: String,
		index: true,
		trim: true,
	},
	targetAudience: {
		type: String,
		index: true,
		trim: true,
	},
	focus: {
		type: String,
		index: true,
		trim: true,
	},
	contentPillar: {
		type: String,
		index: true,
		trim: true,
	},
	contentType: {
		type: String,
		index: true,
		trim: true,
	},
	platform: {
		type: String,
		index: true,
		trim: true,
	},
	captions: {
		type: [String],
		index: true,
		trim: true,
	},
	hashtags: {
		type: [String],
		index: true,
		trim: true,
	},
	postingDate: {
		type: Date,
		index: true,
	},
	isSelfCreated: {
		type: Boolean,
		default: false,
	},
	isCompleted: {
		type: Boolean,
		default: false,
		index: true,
	},
	isDeleted: {
		type: Boolean,
		default: false,
		index: true,
	},
}, { strict: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

// ADD PAGINATION //
contentSchema.plugin(mongoosePaginate);

// DEFINE USERS MODEL IF IT HASN'T BEEN DEFINED YET
const Content = mongoose.models.content || mongoose.model("content", contentSchema);

export { Content };
