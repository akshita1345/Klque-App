import { NextRequest } from "next/server";
import corsMiddleware from "./corsMiddleware";
import dbConnect from "./dbConnect";

const publicApiHandler = async (req: NextRequest, handler: Function) => {
    // CONNECT TO DATABASE
    await dbConnect();
    // WRAP THE HANDLER WITH CORS ONLY
    return await corsMiddleware(req, handler);
};

export default publicApiHandler;