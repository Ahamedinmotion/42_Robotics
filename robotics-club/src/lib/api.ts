export function ok(data: unknown, status = 200) {
	return Response.json({ success: true, ok: true, data }, { status });
}

export function err(message: string, status = 400) {
	return Response.json({ success: false, ok: false, error: message }, { status });
}
