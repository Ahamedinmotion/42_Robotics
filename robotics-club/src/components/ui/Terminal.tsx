"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface UserData {
	login: string;
	currentRank: string;
	name: string;
	completedProjects: number;
	evaluationsGiven: number;
	topSkill: string | null;
	joinedAt: string;
	activeProject: string | null;
	blackholeDays: number | null;
}

interface ProjectData {
	title: string;
	status: string;
}

interface SkillData {
	skillTag: string;
	projectsCompleted: number;
}

interface TerminalProps {
	user: UserData;
	projects: ProjectData[];
	skills: SkillData[];
	isOpen: boolean;
	onClose: () => void;
}

export function Terminal({ user, projects, skills, isOpen, onClose }: TerminalProps) {
	const [lines, setLines] = useState<string[]>([]);
	const [input, setInput] = useState("");
	const [hasBooted, setHasBooted] = useState(false);
	const [isBooting, setIsBooting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	const bootSequence = useMemo(() => [
		{ text: "ROBOTICS CLUB OS v2.6.1", delay: 0 },
		{ text: "Initialising systems...", delay: 200 },
		{ text: "Loading cursus engine............. OK", delay: 500 },
		{ text: "Syncing blackhole monitor......... OK", delay: 800 },
		{ text: `Authenticating user: ${user.login}...... OK`, delay: 1100 },
		{ text: "Welcome back, Engineer.", delay: 1400 },
		{ text: "", delay: 1600 },
		{ text: "Type 'help' for available commands.", delay: 1700 },
		{ text: "", delay: 1800 },
	], [user.login]);

	useEffect(() => {
		if (isOpen) {
			if (!hasBooted && !isBooting) {
				setIsBooting(true);
				bootSequence.forEach((line) => {
					setTimeout(() => {
						setLines((prev) => [...prev, line.text]);
						if (line.text === bootSequence[bootSequence.length - 1].text) {
							setHasBooted(true);
							setIsBooting(false);
						}
					}, line.delay);
				});
			} else if (hasBooted) {
				setLines((prev) => [...prev, "Terminal reopened."]);
			}
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen, hasBooted, isBooting, bootSequence]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [lines]);

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [onClose]);

	const processCommand = (cmd: string) => {
		const trimmed = cmd.trim();
		const promptStr = `rc@robotics:~$ ${trimmed}`;
		setLines((prev) => [...prev, promptStr]);

		if (trimmed === "") return;

		const lower = trimmed.toLowerCase();

		if (lower === "help") {
			setLines((prev) => [
				...prev,
				"> Available commands:",
				"> whoami       — display your identity",
				"> ls projects  — list your projects",
				"> cat stats    — view your statistics",
				"> ls skills    — view skill breakdown",
				"> clear        — clear terminal",
				"> exit         — close terminal",
				"> ",
				"# Try some others. We won't tell you what they do.",
			]);
		} else if (lower === "whoami") {
			setLines((prev) => [
				...prev,
				`> ${user.name} | Rank ${user.currentRank} | ${user.completedProjects} projects completed`,
				`> Active project: ${user.activeProject || "None"}`,
				`> Blackhole: ${user.blackholeDays !== null ? user.blackholeDays + " days remaining" : "N/A"}`,
				"> Status: BUILDING",
			]);
		} else if (lower === "ls" || lower === "ls projects") {
			if (projects.length === 0) {
				setLines((prev) => [...prev, "# No completed projects yet. Get building."]);
			} else {
				projects.forEach((p) => {
					setLines((prev) => [...prev, `> ${p.title}/     [${p.status}]`]);
				});
			}
		} else if (lower === "cat stats") {
			const joined = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(user.joinedAt));
			setLines((prev) => [
				...prev,
				`> Projects completed : ${user.completedProjects}`,
				`> Evaluations given  : ${user.evaluationsGiven}`,
				`> Top skill          : ${user.topSkill || "none yet"}`,
				`> Member since       : ${joined}`,
				`> Rank               : ${user.currentRank}`,
			]);
		} else if (lower === "ls skills") {
			skills.slice(0, 5).forEach((s) => {
				setLines((prev) => [...prev, `> ${s.skillTag.padEnd(24)} ${s.projectsCompleted} project(s)`]);
			});
		} else if (lower === "clear") {
			setLines([]);
		} else if (lower === "exit") {
			setLines((prev) => [...prev, "> Goodbye, Engineer."]);
			setTimeout(onClose, 600);
		} else if (lower === "sudo" || lower.startsWith("sudo ")) {
			setLines((prev) => [...prev, "! Permission denied. Nice try."]);
		} else if (lower === "hack" || lower === "hax") {
			setLines((prev) => [
				...prev,
				"> Initiating hack sequence...",
				"> Scanning network...",
				"> Access granted to: absolutely nothing.",
				"> Nice try.",
			]);
		} else if (lower === "rm -rf /" || lower === "rm -rf") {
			setLines((prev) => [...prev, "! CRITICAL ERROR: Just kidding.", "> Your data is safe. Probably."]);
		} else if (lower === "ls -la" || lower === "ls -l") {
			setLines((prev) => [
				...prev,
				"> drwxr-xr-x  cursus/",
				"> drwxr-xr-x  projects/",
				"> drwxr-xr-x  evaluations/",
				"> -rw-r--r--  blackhole.log",
				"> -rw-------  secrets.txt",
				"# You don't have permission to read secrets.txt",
			]);
		} else if (lower === "cat secrets.txt") {
			setLines((prev) => [...prev, "! Permission denied.", "# Some things are not meant to be known."]);
		} else if (lower === "cat blackhole.log") {
			let warning = "NONE — no active project";
			if (user.blackholeDays !== null) {
				if (user.blackholeDays > 7) warning = "LOW";
				else if (user.blackholeDays >= 3) warning = "MODERATE";
				else warning = "CRITICAL";
			}
			setLines((prev) => [
				...prev,
				`> ${user.blackholeDays || 0} days remaining on active project.`,
				`> Warning level: ${warning}`,
			]);
		} else if (lower === "uname" || lower === "uname -a") {
			setLines((prev) => [
				...prev,
				"> RoboticsOS 2.6.1 #1 SMP 42-School",
				"> Arch: arm64 | Lab: Room 204",
			]);
		} else if (lower === "date") {
			setLines((prev) => [...prev, `> ${new Date().toString()}`]);
		} else if (lower === "ping") {
			setLines((prev) => [
				...prev,
				"> PING robotics.club: 56 data bytes",
				"> 64 bytes from robotics.club: time=0.42ms",
				"> 64 bytes from robotics.club: time=0.38ms",
				"# Latency is not your problem. Ship the project.",
			]);
		} else if (lower === "git status") {
			setLines((prev) => [
				...prev,
				"> On branch main",
				`> Your branch is ahead of 'origin/main' by ${user.completedProjects} commits.`,
				"> ",
				"# Keep committing.",
			]);
		} else if (lower === "git log") {
			setLines((prev) => [
				...prev,
				"> commit a3f92b1 — \"Final submission\"",
				"> commit 8d4c2e0 — \"It works now\"",
				"> commit 3b1a9f7 — \"Fix bug\"",
				"> commit 9c2d8e1 — \"Add feature\"",
				"> commit 1f0e3a2 — \"Initial commit\"",
			]);
		} else {
			setLines((prev) => [...prev, `! Command not found: ${trimmed}`, "> Type 'help' for available commands."]);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		processCommand(input);
		setInput("");
	};

	return (
		<div
			className={`fixed bottom-0 left-0 right-0 z-[9999] h-[380px] border-t border-accent bg-[#0A0806] shadow-2xl transition-transform duration-300 ease-in-out ${
				isOpen ? "translate-y-0" : "translate-y-full"
			}`}
			style={{ fontFamily: "'Courier New', monospace" }}
		>
			{/* Header */}
			<div className="flex h-8 items-center justify-between border-bottom border-[#2A2218] bg-[#141210] px-3">
				<div className="flex gap-1.5">
					<div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
					<div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
					<div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
				</div>
				<div className="text-[11px] text-[#5C4A38]">rc@robotics: ~</div>
				<div className="text-[10px] text-[#5C4A38]">ESC to close</div>
			</div>

			{/* Output area */}
			<div ref={scrollRef} className="flex h-[312px] flex-col overflow-y-auto p-3 text-[13px] leading-relaxed">
				{lines.map((line, i) => {
					let color = "text-[#F5EDE0]";
					let content = line;

					if (line.startsWith("rc@robotics:~$")) {
						const [prompt, ...rest] = line.split(" ");
						return (
							<div key={i}>
								<span className="text-accent">{prompt} </span>
								<span className="text-[#F5EDE0]">{rest.join(" ")}</span>
							</div>
						);
					}

					if (line.startsWith(">")) color = "text-[#F5EDE0]";
					else if (line.startsWith("!")) color = "text-[#FF2D6B]";
					else if (line.startsWith("#")) color = "text-[#5C4A38]";

					if (content === "") return <br key={i} />;

					return (
						<div key={i} className={color}>
							{content}
						</div>
					);
				})}
				{isBooting && <div className="animate-pulse text-accent">_</div>}
			</div>

			{/* Input row */}
			{!isBooting && hasBooted && (
				<form onSubmit={handleSubmit} className="flex h-9 items-center bg-[#141210] px-3">
					<span className="text-accent text-[13px] mr-2">rc@robotics:~$ </span>
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						className="flex-1 bg-transparent text-[#F5EDE0] outline-none text-[13px]"
						autoFocus
					/>
				</form>
			)}
		</div>
	);
}
