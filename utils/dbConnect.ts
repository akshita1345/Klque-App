import mongoose from "mongoose";
declare global {
    var mongoose: any; // This must be a `var` and not a `let / const`
}

const MONGODB_URI = process.env.MONGODB_URL!;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local",
    );
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const dbConnect = async () => {
    if (cached.conn) {
        //console.log("🚀 ~ ==============> Already connected!")
        // here it will use cached
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
            heartbeatFrequencyMS: 10000, // set the heartbeat frequency
            socketTimeoutMS: 0,
        };
        // here it will connect
        // console.log("🚀 ~ ==============> New Connection!")
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.log("🚀 ~ file: dbConnect.ts:46 ~ dbConnect ~ e:", e)

    }

    return cached.conn;
}

export default dbConnect;