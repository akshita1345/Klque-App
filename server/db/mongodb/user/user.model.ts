import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema({
	name: {
		type: String,
	},
	lastName: {
		type: String,
	},
	profession: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		index: true,
		trim: true,
	},
	social: {
		googleProvider: {
			id: String,
			token: String
		}
	},
	password: {
		type: String,
	},
	onboarding: {
		describe: {
			type: [String],
			index: true,
		},
		mainGoal: {
			type: String,
			index: true,
		},
		newVibe: {
			type: [String],
			index: true,
		},
		businessInfo: {
			name: {
				type: String,
			},
			industry: {
				type: String,
			},
			website: {
				type: String,
			},
			sites: [String],
		},
		profileSummary: {
			coreValues: [String],
			niche: [String],
			audience: [String],
			audienceObjectives: [String],
			audiencePainPoints: [String],
		},
		toneVoice: {
			tone: [String],
			voice: [String],
		},
		suggestedScripts: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "chatconversation",
		},
		startOnboarding: {
			type: [String],
			index: true,
		},
		contentType: {
			type: [String],
			index: true,
		},
		goal: {
			type: String,
			index: true,
		},
		vibe: {
			type: [String],
			index: true,
		},
		platform: {
			type: [String],
			index: true,
		},
		subContent: {
			type: [String],
			index: true,
		},
		niche: {
			type: [String],
			index: true,
		},
		isPersonal: {
			type: Boolean,
			default: false,
		},
		tour: {
			isCompleted: {
				type: Boolean,
				default: false,
			},
			currentStep: {
				type: Number,
				default: 0,
			}
		}
	},
	onboardingStep: {
		type: Number,
		default: 0,
		index: true,
	},
	isOnboarded: {
		type: Boolean,
		default: false,
		index: true,
	},
	emailVerified: {
		type: Boolean,
		default: false,
		index: true,
	},
	emailVerificationToken: {
		type: String,
		default: "",
		required: false
	},
	otp: {
		type: Number,
		required: false
	},
	verificationSecretTime: {
		type: Date,
		required: false
	},
	lastConversationHistoryId: {
		type: ObjectId,
		ref: "chathistory",
		index: true
	},
	isDeleted: {
		type: Boolean,
		default: false,
		index: true,
	},
	isLastReplyQue: {
		type: Boolean,
		default: false,
		index: true,
	},
	isLastReplyIdeaScript: {
		type: Boolean,
		default: false,
		index: true,
	},
	subscriptionId: {
		type: String,
		index: true,
	},
	customerId: {
		type: String,
		index: true,
	},
	status: {
		type: String,
		enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
		default: 'inactive',
		index: true,
	},
	plan: {
		type: String,
	},
	planTime: {
		type: String,
	},
	planId: {
		type: String,
		index: true,
	},
	sessionCode: {
		type: String,
		index: true,
	},
	expiryDate: {
		type: Date,
		index: true,
	},
	isSubscriptionCancel: {
		type: Boolean,
		default: false,
		index: true,
	},
	isSubscribed: {
		type: Boolean,
		default: false,
		index: true,
	},
	savedResponseCount: {
		type: Number,
		default: 0,
	},
	savedScriptsCount: {
		type: Number,
		default: 0,
	},
	selectedPlan: {
		type: String,
		trim: true
	},
	planInvites: {
		type: Boolean,
		default: true,
	},
	taskInvites: {
		type: Boolean,
		default: true,
	},
}, { strict: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

// ADD PAGINATION //
userSchema.plugin(mongoosePaginate);

// ENCRYPT PASSWORD //
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	this.password = this.password ? await bcrypt.hash(this.password, 12) : "";
	next();
});

// PASSWORD BCRYPT & VALIDATION //
userSchema.methods.validatePassword = async function (password: string) {
	return await bcrypt.compare(password, this.password);
};

// DEFINE USERS MODEL IF IT HASN'T BEEN DEFINED YET
const User = mongoose?.models?.users || mongoose.model("users", userSchema);

export { User };