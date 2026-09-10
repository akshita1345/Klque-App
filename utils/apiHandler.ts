import { NextRequest } from "next/server";
import corsMiddleware from "./corsMiddleware";
import dbConnect from "./dbConnect";
import authMiddleware from "./authMiddleware";

const apiHandler = async (req: NextRequest, handler: Function) => {
    // CONNECT TO DATABASE
    await dbConnect();
    // WRAP THE AUTH HANDLER WITH CORS
    return await corsMiddleware(req, async (req: NextRequest) => {
        return await authMiddleware(req, handler);
    });

};

export default apiHandler;