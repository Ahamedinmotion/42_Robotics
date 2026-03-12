export default function CursusLoading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="h-10 w-48 rounded-full bg-panel" />
			
			<div className="grid grid-cols-1 gap-8">
				{[1, 2, 3].map((row) => (
					<div key={row} className="space-y-4">
						<div className="h-6 w-24 rounded bg-panel2" />
						<div className="flex flex-wrap gap-4">
							{[1, 2, 3, 4].map((node) => (
								<div key={node} className="h-24 w-24 rounded-full bg-panel" />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
