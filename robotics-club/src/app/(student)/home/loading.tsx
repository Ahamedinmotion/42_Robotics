export default function HomeLoading() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* Identity Strip Skeleton */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex items-center gap-4">
					<div className="h-12 w-12 rounded-full bg-panel2" />
					<div className="space-y-2">
						<div className="h-5 w-32 rounded bg-panel2" />
						<div className="h-4 w-20 rounded bg-panel2" />
					</div>
				</div>
				<div className="flex gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="text-center">
							<div className="mx-auto h-6 w-10 rounded bg-panel2" />
							<div className="mt-1 h-3 w-12 rounded bg-panel2" />
						</div>
					))}
				</div>
			</div>

			<div className="space-y-2">
				<div className="h-4 w-1/3 rounded bg-panel2" />
				<div className="h-3 w-1/2 rounded bg-panel2" />
			</div>

			{/* 3-Column Grid Skeleton */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<div className="space-y-6 md:col-span-2">
					<div className="h-48 rounded-xl bg-panel" />
					<div className="h-32 rounded-xl bg-panel" />
				</div>
				<div className="space-y-6">
					<div className="h-32 rounded-xl bg-panel" />
					<div className="h-48 rounded-xl bg-panel" />
					<div className="h-64 rounded-xl bg-panel" />
				</div>
			</div>
		</div>
	);
}
