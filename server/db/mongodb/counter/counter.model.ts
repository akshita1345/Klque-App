import mongoose from "mongoose";

let { ObjectId } = mongoose.Schema.Types;

const counterSchema: any = new mongoose.Schema(
	{
		userId: {
			type: ObjectId,
			ref: "users",
		},
		usedCreditsCount: {
			type: Number,
			default: 0,
		},
	}
	,
	{ timestamps: true, strict: false })

// DEFINE COUNTER MODEL IF IT HASN'T BEEN DEFINED YET
const Counter = mongoose.models.counter || mongoose.model("counter", counterSchema);

export { Counter };