import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { err, ok } from "@/lib/api";


const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const formData = await req.formData();
		const file = formData.get("file") as File;
		const teamId = formData.get("teamId") as string;
		const uploadType = formData.get("type") as string; // 'reports' or 'fabrication'

		if (!file) return err("No file provided", 400);
		if (!teamId) return err("Missing teamId", 400);

		if (!ALLOWED_TYPES.includes(file.type)) {
			return err(`File type ${file.type} not allowed`, 400);
		}

		if (file.size > MAX_FILE_SIZE) {
			return err("File size exceeds 5MB limit", 400);
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		const folder = `robotics-club/${uploadType || "general"}/${teamId}`;

		return new Promise<NextResponse>((resolve) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{ 
					folder,
					resource_type: "auto",
				},
				(error, result) => {
					if (error) {
						resolve(err(error.message, 500) as NextResponse);
					} else {
						resolve(
							ok({
								url: result?.secure_url,
								publicId: result?.public_id,
								width: result?.width,
								height: result?.height,
							}) as NextResponse
						);
					}
				}
			);

			uploadStream.end(buffer);
		});
	} catch (error: any) {
		return err(error.message || "Upload failed", 500);
	}
}
