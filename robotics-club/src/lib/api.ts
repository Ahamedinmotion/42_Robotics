export function ok(data: unknown, status = 200) {
	return Response.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
	return Response.json({ success: false, error: message }, { status });
}
