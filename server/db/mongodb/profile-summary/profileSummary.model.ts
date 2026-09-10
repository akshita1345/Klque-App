import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ObjectId = mongoose.Schema.Types.ObjectId;

const profileSummarySchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "user",
    },
    profileSummary: {
        core_values: [String],
        niche: [String],
        target_audience: [String],
        audience_objectives: [String],
        audience_pain_points: [String],
        CTA: [String],
        sources: [String],
        tones: [String],
        voice: [String],
    },
}, { strict: false, timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

// PASSWORD BCRYPT & VALIDATION //
profileSummarySchema.methods.validateProfileSummary = async function (profileSummary: string) {
    return await bcrypt.compare(profileSummary, this.profileSummary);
};

// DEFINE PROFILE SUMMARY MODEL IF IT HASN'T BEEN DEFINED YET
const ProfileSummary = mongoose?.models?.profileSummary || mongoose.model("profileSummary", profileSummarySchema);

export { ProfileSummary };
