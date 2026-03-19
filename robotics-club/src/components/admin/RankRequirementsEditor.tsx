"use client";

import { useState, useEffect } from "react";
import { Rank } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface RankReq {
	rank: Rank;
	projectsRequired: number;
	requiredProjectCount: number;
}

export function RankRequirementsEditor() {
	const [reqs, setReqs] = useState<RankReq[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<Record<string, boolean>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { toast } = useToast();

	const RANKS: Rank[] = ["E", "D", "C", "B", "A", "S"];

	useEffect(() => {
		fetch("/api/cursus/rank-requirements")
			.then(res => res.json())
			.then(json => {
				if (json.ok) {
					// We need the counts as well. The GET API currently doesn't return requiredProjectCount.
					// Wait, the API I wrote just returns the DB records, not the active required count!
					// I should update the GET API or fetch counts here.
				}
			})
			.finally(() => setLoading(false));
	}, []);
	
	// I'll rewrite the API and fetch logic.
	return null;
}
