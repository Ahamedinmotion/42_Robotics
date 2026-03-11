"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal } from "./Terminal";

export function TerminalProvider() {
	const [isOpen, setIsOpen] = useState(false);
	const [userData, setUserData] = useState<any>(null);
	const [projects, setProjects] = useState<any[]>([]);
	const [skills, setSkills] = useState<any[]>([]);
	const sequenceRef = useRef<string[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch("/api/user/me");
				if (res.ok) {
					const data = await res.json();
					setUserData({
						login: data.login,
						name: data.name,
						currentRank: data.currentRank,
						completedProjects: data.completedProjects || 0,
						evaluationsGiven: data.evaluationsGiven || 0,
						topSkill: data.skillProgress?.[0]?.skillTag || null,
						joinedAt: data.joinedAt,
						activeProject: data.activeProject || null,
						blackholeDays: data.blackholeDays || null,
					});
					setProjects(data.projects || []);
					setSkills(data.skillProgress || []);
				}
			} catch (error) {
				console.error("Terminal data fetch error:", error);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if focused on input/textarea
			const active = document.activeElement;
			if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;

			if (e.key === "Enter") {
				const lastTwo = sequenceRef.current.slice(-2);
				if (lastTwo[0] === "r" && lastTwo[1] === "c") {
					setIsOpen(true);
					sequenceRef.current = [];
				} else {
					sequenceRef.current = [];
				}
				return;
			}

			// Only track letters
			if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
				sequenceRef.current.push(e.key.toLowerCase());
				// Keep only last 2
				if (sequenceRef.current.length > 2) {
					sequenceRef.current.shift();
				}
			} else if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
				// Reset on other functional keys
				sequenceRef.current = [];
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	if (!userData) return null;

	return (
		<Terminal
			user={userData}
			projects={projects}
			skills={skills}
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
		/>
	);
}
