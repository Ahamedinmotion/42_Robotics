export default function AdminLoading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="flex items-center justify-between">
				<div className="h-8 w-48 rounded bg-panel" />
				<div className="h-10 w-32 rounded bg-panel" />
			</div>
			<div className="h-12 w-full rounded bg-panel" />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
				<div className="lg:col-span-1 space-y-4">
					{[1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="h-10 w-full rounded bg-panel2" />
					))}
				</div>
				<div className="lg:col-span-3 space-y-6">
					<div className="h-64 w-full rounded-xl bg-panel" />
					<div className="h-96 w-full rounded-xl bg-panel" />
				</div>
			</div>
		</div>
	);
}
