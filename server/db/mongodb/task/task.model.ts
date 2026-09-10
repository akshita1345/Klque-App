import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

let { ObjectId } = mongoose.Schema.Types;

const TaskSchema = new mongoose.Schema({
	userId: {
		type: ObjectId,
		ref: "users",
		index: true
	},
	contentId: {
		type: ObjectId,
		ref: "content",
		index: true
	},
	title: {
		type: String,
		trim: true,
		index: true
	},
	priority: {
		type: String,
		index: true
	},
	date: {
		type: Date,
		index: true
	},
	isCompleted: {
		type: Boolean,
		default: false,
	},
	isDeleted: {
		type: Boolean,
		default: false,
		index: true,
	},
}, { strict: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

// ADD PAGINATION //
TaskSchema.plugin(mongoosePaginate);

// DEFINE USERS MODEL IF IT HASN'T BEEN DEFINED YET
const Task = mongoose.models.task || mongoose.model("task", TaskSchema);

export { Task };