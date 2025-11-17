<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger,
	} from "$lib/components/ui/alert-dialog/index.js";
	import { ExternalLink, Check, X, RotateCcw, Save, RefreshCw, User, FolderOpen, FileText, Search, Filter, X as XIcon, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "@lucide/svelte";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger,
	} from "$lib/components/ui/sheet/index.js";

	type AdminLightUser = {
		userId: number;
		firstName: string | null;
		lastName: string | null;
		email: string;
		birthday: string | null;
		addressLine1: string | null;
		addressLine2: string | null;
		city: string | null;
		state: string | null;
		country: string | null;
		zipCode: string | null;
		hackatimeAccount: string | null;
		hackatimeAccountId: string | null;
		trustLevel: string | null;
		createdAt: string;
		updatedAt: string;
	};

	type AdminSubmission = {
		submissionId: number;
		approvalStatus: string;
		approvedHours: number | null;
		hoursJustification: string | null;
		description: string | null;
		playableUrl: string | null;
		repoUrl: string | null;
		screenshotUrl: string | null;
		createdAt: string;
		updatedAt: string;
		project: {
			projectId: number;
			projectTitle: string;
			description: string | null;
			playableUrl: string | null;
			repoUrl: string | null;
			screenshotUrl: string | null;
			nowHackatimeHours: number | null;
			nowHackatimeProjects: string[] | null;
			user: AdminLightUser;
		};
	};

	type AdminProject = {
		projectId: number;
		projectTitle: string;
		description: string | null;
		projectType: string;
		nowHackatimeHours: number | null;
		nowHackatimeProjects: string[] | null;
		playableUrl: string | null;
		repoUrl: string | null;
		screenshotUrl: string | null;
		approvedHours: number | null;
		isLocked: boolean;
		createdAt: string;
		updatedAt: string;
		user: AdminLightUser;
		submissions: {
			submissionId: number;
			approvalStatus: string;
			approvedHours: number | null;
			createdAt: string;
		}[];
	};

	type AdminUser = AdminLightUser & {
		role: string;
		onboardComplete: boolean;
		projects: AdminProject[];
	};

type AdminMetrics = {
	totalHackatimeHours: number;
	totalApprovedHours: number;
		totalHackatimeHoursOnProjectsWithSubmissions: number;
	totalUsers: number;
	totalProjects: number;
};

	type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

	let { data }: { data: PageData } = $props();

const toSubmissionDraft = (submission: AdminSubmission) => ({
	approvalStatus: submission.approvalStatus,
	approvedHours: submission.approvedHours !== null 
		? submission.approvedHours.toString() 
		: (submission.project.nowHackatimeHours !== null ? submission.project.nowHackatimeHours.toFixed(1) : ''),
	hoursJustification: submission.hoursJustification ?? ''
});

const buildSubmissionDrafts = (list: AdminSubmission[]) => {
	const drafts: Record<number, { approvalStatus: string; approvedHours: string; hoursJustification: string }> = {};
	for (const submission of list) {
		drafts[submission.submissionId] = toSubmissionDraft(submission);
	}
	return drafts;
};

let submissions = $state<AdminSubmission[]>(data.submissions ?? []);
let projects = $state<AdminProject[]>(data.projects ?? []);
let users = $state<AdminUser[]>(data.users ?? []);
let metrics = $state<AdminMetrics>(
	data.metrics ?? {
		totalHackatimeHours: 0,
		totalApprovedHours: 0,
			totalHackatimeHoursOnProjectsWithSubmissions: 0,
		totalUsers: 0,
		totalProjects: 0,
	}
);

let submissionsLoaded = $state((data.submissions?.length ?? 0) > 0);
let projectsLoaded = $state((data.projects?.length ?? 0) > 0);
let usersLoaded = $state((data.users?.length ?? 0) > 0);

let statusFilter = $state<StatusFilter>('all');

	let searchQuery = $state('');
	let selectedStatuses = $state<Set<string>>(new Set());
	let selectedProjectTypes = $state<Set<string>>(new Set());
	let sortBy = $state<string>('date-desc');
	let showFilterPopover = $state(false);
	
	// Billy date range (start: Oct 10, 2025, end: current date)
	const getDefaultStartDate = () => {
		return '2025-10-10';
	};
	const getDefaultEndDate = () => {
		const today = new Date();
		return today.toISOString().split('T')[0];
	};
	let billyDateStart = $state(getDefaultStartDate());
	let billyDateEnd = $state(getDefaultEndDate());

	function generateBillyLink(hackatimeAccount: string | number | null): string | null {
		if (!hackatimeAccount) return null;
		// Extract numeric ID from hackatime account (Billy uses numeric user IDs)
		// The account might be a username or numeric ID - extract the numeric part
		const hackatimeId = typeof hackatimeAccount === 'number' 
			? hackatimeAccount.toString() 
			: hackatimeAccount.match(/\d+/)?.[0];
		if (!hackatimeId) return null;
		
		// Format dates as YYYY-MM-DD-YYYY-MM-DD (keep dashes in dates, dash between them)
		const dateRange = `${billyDateStart}-${billyDateEnd}`;
		return `https://billy.3kh0.net/?u=${hackatimeId}&d=${dateRange}`;
	}

	function openBillyLink(hackatimeAccount: string | number | null) {
		const link = generateBillyLink(hackatimeAccount);
		if (link) {
			window.open(link, '_blank', 'noopener,noreferrer');
		}
	}

const apiUrl = data.apiUrl;
const statusOptions = ['pending', 'approved', 'rejected'];

	let submissionsLoading = $state(false);
	let projectsLoading = $state(false);
	let usersLoading = $state(false);
	let metricsLoading = $state(false);

	let recalcAllBusy = $state(false);
	let recalculateProgress = $state<{ current: number; total: number; updated: number; skipped: number; errors: number } | null>(null);
	let bulkProjectMessage = $state('');
	let bulkProjectError = $state('');

let submissionDrafts = $state<Record<number, { approvalStatus: string; approvedHours: string; hoursJustification: string }>>(
	buildSubmissionDrafts(data.submissions ?? [])
);
let submissionSaving = $state<Record<number, boolean>>({});
let submissionErrors = $state<Record<number, string>>({});
let submissionSuccess = $state<Record<number, string>>({});
let submissionRecalculating = $state<Record<number, boolean>>({});
let addressExpanded = $state<Record<number, boolean>>({});

let projectBusy = $state<Record<number, boolean>>({});
let projectErrors = $state<Record<number, string>>({});
let projectSuccess = $state<Record<number, string>>({});

function setSubmissionDraft(entry: AdminSubmission, force = false) {
	if (!force && submissionDrafts[entry.submissionId]) {
		return;
	}

	submissionDrafts = {
		...submissionDrafts,
		[entry.submissionId]: toSubmissionDraft(entry),
	};
}

	function formatDate(value: string) {
		return new Date(value).toLocaleString();
	}

	function formatHours(value: number | null) {
		if (value === null || value === undefined) {
			return '—';
		}
		return value.toFixed(1);
	}

	function fullName(user: AdminLightUser) {
		const first = user.firstName ?? '';
		const last = user.lastName ?? '';
		const name = `${first} ${last}`.trim();
		return name || 'Unknown';
	}

function formatTotalHoursValue(value: number) {
	return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatCount(value: number) {
	return value.toLocaleString();
}

	async function loadSubmissions(autoRecalculate = false) {
		submissionsLoading = true;
		try {
			const response = await fetch(`${apiUrl}/api/admin/submissions`, {
				credentials: 'include',
			});
			if (response.ok) {
			const next: AdminSubmission[] = await response.json();
			submissions = next;
			submissionDrafts = buildSubmissionDrafts(next);
				submissionErrors = {};
				submissionSuccess = {};
				submissionsLoaded = true;

				if (autoRecalculate) {
					const pendingSubmissions = next.filter(s => s.approvalStatus === 'pending');
					for (const submission of pendingSubmissions) {
						recalculateSubmissionHours(submission.submissionId, submission.project.projectId);
					}
				}
			}
		} finally {
			submissionsLoading = false;
		}
	}

	async function loadProjects() {
		projectsLoading = true;
		try {
			const response = await fetch(`${apiUrl}/api/admin/projects`, {
				credentials: 'include',
			});
			if (response.ok) {
				projects = await response.json();
				projectErrors = {};
				projectSuccess = {};
				projectsLoaded = true;
			}
		} finally {
			projectsLoading = false;
		}
	}

	async function loadUsers() {
		usersLoading = true;
		try {
			const response = await fetch(`${apiUrl}/api/admin/users`, {
				credentials: 'include',
			});
			if (response.ok) {
				users = await response.json();
				usersLoaded = true;
			}
		} finally {
			usersLoading = false;
		}
	}

async function loadMetrics() {
	metricsLoading = true;
	try {
		const response = await fetch(`${apiUrl}/api/admin/metrics`, {
			credentials: 'include',
		});

		if (response.ok) {
			const result = await response.json();
			metrics = result.totals ?? result;
		}
	} finally {
		metricsLoading = false;
	}
}

async function recalculateAllProjectsHours() {
	if (recalcAllBusy) {
		return;
	}

	recalcAllBusy = true;
	bulkProjectMessage = '';
	bulkProjectError = '';
	recalculateProgress = null;

	try {
		const response = await fetch(`${apiUrl}/api/admin/projects/recalculate-all`, {
			method: 'POST',
			credentials: 'include',
		});

		if (!response.ok) {
			const { message } = await response.json().catch(() => ({ message: 'Failed to recalculate projects' }));
			bulkProjectError = message ?? 'Failed to recalculate projects';
			return;
		}

		if (!response.body) {
			bulkProjectError = 'No response body';
			return;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		let updated = 0;
		let skipped = 0;
		let errors = 0;
		let total = 0;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			const lines = chunk.split('\n');

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					try {
						const data = JSON.parse(line.slice(6));
						
						if (data.type === 'start') {
							total = data.total;
							recalculateProgress = { current: 0, total, updated: 0, skipped: 0, errors: 0 };
						} else if (data.type === 'progress') {
							if (data.status === 'updated') updated++;
							else if (data.status === 'skipped') skipped++;
							else if (data.status === 'error') errors++;
							
							recalculateProgress = {
								current: data.current,
								total: data.total,
								updated,
								skipped,
								errors,
							};
						} else if (data.type === 'summary') {
							recalculateProgress = {
								current: data.processed,
								total: data.processed,
								updated: data.updated,
								skipped: data.skipped,
								errors: data.errors,
							};
						} else if (data.type === 'complete') {
							break;
						} else if (data.type === 'error') {
							bulkProjectError = data.message ?? 'Unknown error occurred';
							break;
						}
					} catch (e) {
						console.error('Error parsing SSE data:', e);
					}
				}
			}
		}

		const finalUpdated = recalculateProgress?.updated ?? updated;
		bulkProjectMessage = `Recalculated ${finalUpdated} project${finalUpdated === 1 ? '' : 's'}.`;
		
		if (recalculateProgress && (recalculateProgress.skipped > 0 || recalculateProgress.errors > 0)) {
			const parts = [];
			if (recalculateProgress.skipped > 0) parts.push(`${recalculateProgress.skipped} skipped`);
			if (recalculateProgress.errors > 0) parts.push(`${recalculateProgress.errors} errors`);
			bulkProjectMessage += ` (${parts.join(', ')})`;
		}

		await loadProjects();
		await loadSubmissions();
		await loadUsers();
		await loadMetrics();
	} catch (err) {
		bulkProjectError = err instanceof Error ? err.message : 'Failed to recalculate projects';
	} finally {
		recalcAllBusy = false;
		recalculateProgress = null;
	}
}

	async function saveSubmission(submissionId: number) {
		const draft = submissionDrafts[submissionId];
		if (!draft) {
			return;
		}

		submissionSaving = { ...submissionSaving, [submissionId]: true };
		submissionErrors = { ...submissionErrors, [submissionId]: '' };
		submissionSuccess = { ...submissionSuccess, [submissionId]: '' };

		const payload = {
			approvalStatus: draft.approvalStatus,
			approvedHours: draft.approvedHours === '' ? null : parseFloat(draft.approvedHours),
			hoursJustification: draft.hoursJustification === '' ? null : draft.hoursJustification,
		};

		try {
			const response = await fetch(`${apiUrl}/api/admin/submissions/${submissionId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const { message } = await response.json().catch(() => ({ message: 'Failed to update submission' }));
				submissionErrors = { ...submissionErrors, [submissionId]: message ?? 'Failed to update submission' };
				return;
			}

			submissionSuccess = { ...submissionSuccess, [submissionId]: 'Submission updated' };
			await loadSubmissions();
			await loadProjects();
			await loadMetrics();
		} catch (err) {
			submissionErrors = {
				...submissionErrors,
				[submissionId]: err instanceof Error ? err.message : 'Failed to update submission',
			};
		} finally {
			submissionSaving = { ...submissionSaving, [submissionId]: false };
		}
	}

	async function quickApprove(submission: AdminSubmission) {
		submissionSaving = { ...submissionSaving, [submission.submissionId]: true };
		submissionErrors = { ...submissionErrors, [submission.submissionId]: '' };
		submissionSuccess = { ...submissionSuccess, [submission.submissionId]: '' };

		const draft = submissionDrafts[submission.submissionId];
		const hoursJustification = draft?.hoursJustification || '';

		try {
			const response = await fetch(`${apiUrl}/api/admin/submissions/${submission.submissionId}/quick-approve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ hoursJustification }),
			});

			if (!response.ok) {
				const { message } = await response.json().catch(() => ({ message: 'Failed to quick approve submission' }));
				submissionErrors = { ...submissionErrors, [submission.submissionId]: message ?? 'Failed to quick approve submission' };
				return;
			}

			submissionSuccess = { ...submissionSuccess, [submission.submissionId]: 'Submission quick approved and synced to Airtable' };
			await loadSubmissions();
			await loadProjects();
			await loadMetrics();
		} catch (err) {
			submissionErrors = {
				...submissionErrors,
				[submission.submissionId]: err instanceof Error ? err.message : 'Failed to quick approve submission',
			};
		} finally {
			submissionSaving = { ...submissionSaving, [submission.submissionId]: false };
		}
	}

	async function quickDeny(submissionId: number) {
		submissionDrafts[submissionId] = {
			...submissionDrafts[submissionId],
			approvalStatus: 'rejected',
			approvedHours: '0',
		};
		await saveSubmission(submissionId);
	}

	async function recalculateSubmissionHours(submissionId: number, projectId: number) {
		submissionRecalculating = { ...submissionRecalculating, [submissionId]: true };

		try {
			const response = await fetch(`${apiUrl}/api/admin/projects/${projectId}/recalculate`, {
				method: 'POST',
				credentials: 'include',
			});

			if (response.ok) {
				await loadSubmissions();
				const updatedSubmission = submissions.find(s => s.submissionId === submissionId);
				if (updatedSubmission) {
					submissionDrafts[submissionId] = {
						...submissionDrafts[submissionId],
						approvedHours: updatedSubmission.project.nowHackatimeHours?.toFixed(1) ?? ''
					};
				}
			}
		} catch (err) {
			console.error('Failed to recalculate hours:', err);
		} finally {
			submissionRecalculating = { ...submissionRecalculating, [submissionId]: false };
		}
	}

	async function recalculateProject(projectId: number) {
		projectBusy = { ...projectBusy, [projectId]: true };
		projectErrors = { ...projectErrors, [projectId]: '' };
		projectSuccess = { ...projectSuccess, [projectId]: '' };

		try {
			const response = await fetch(`${apiUrl}/api/admin/projects/${projectId}/recalculate`, {
				method: 'POST',
				credentials: 'include',
			});

			if (!response.ok) {
				const { message } = await response.json().catch(() => ({ message: 'Failed to recalculate hours' }));
				projectErrors = { ...projectErrors, [projectId]: message ?? 'Failed to recalculate hours' };
				return;
			}

			projectSuccess = { ...projectSuccess, [projectId]: 'Hours recalculated' };
			await loadProjects();
			await loadSubmissions();
			await loadUsers();
			await loadMetrics();
		} catch (err) {
			projectErrors = {
				...projectErrors,
				[projectId]: err instanceof Error ? err.message : 'Failed to recalculate hours',
			};
		} finally {
			projectBusy = { ...projectBusy, [projectId]: false };
		}
	}

	async function deleteProject(projectId: number) {
		projectBusy = { ...projectBusy, [projectId]: true };
		projectErrors = { ...projectErrors, [projectId]: '' };
		projectSuccess = { ...projectSuccess, [projectId]: '' };

		try {
			const response = await fetch(`${apiUrl}/api/admin/projects/${projectId}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (!response.ok) {
				const { message } = await response.json().catch(() => ({ message: 'Failed to delete project' }));
				projectErrors = { ...projectErrors, [projectId]: message ?? 'Failed to delete project' };
				return;
			}

			projectSuccess = { ...projectSuccess, [projectId]: 'Project removed' };
			await loadProjects();
			await loadSubmissions();
			await loadUsers();
			await loadMetrics();
		} catch (err) {
			projectErrors = {
				...projectErrors,
				[projectId]: err instanceof Error ? err.message : 'Failed to delete project',
			};
		} finally {
			projectBusy = { ...projectBusy, [projectId]: false };
		}
	}

	function toggleStatus(status: string) {
		const newSet = new Set(selectedStatuses);
		if (newSet.has(status)) {
			newSet.delete(status);
		} else {
			newSet.add(status);
		}
		selectedStatuses = newSet;
		if (newSet.size === 0) {
			statusFilter = 'all';
		}
	}

	function toggleProjectType(type: string) {
		const newSet = new Set(selectedProjectTypes);
		if (newSet.has(type)) {
			newSet.delete(type);
		} else {
			newSet.add(type);
		}
		selectedProjectTypes = newSet;
	}

	function removeStatusFilter(status: string) {
		const newSet = new Set(selectedStatuses);
		newSet.delete(status);
		selectedStatuses = newSet;
	}

	function removeProjectTypeFilter(type: string) {
		const newSet = new Set(selectedProjectTypes);
		newSet.delete(type);
		selectedProjectTypes = newSet;
	}

	function clearAllFilters() {
		selectedStatuses = new Set();
		selectedProjectTypes = new Set();
		searchQuery = '';
		statusFilter = 'all';
	}

	function sortSubmissions(list: AdminSubmission[], sortField: string) {
		const sorted = [...list];
		switch (sortField) {
			case 'date-desc':
				return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
			case 'date-asc':
				return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
			case 'hours-desc':
				return sorted.sort((a, b) => (b.project.nowHackatimeHours ?? 0) - (a.project.nowHackatimeHours ?? 0));
			case 'hours-asc':
				return sorted.sort((a, b) => (a.project.nowHackatimeHours ?? 0) - (b.project.nowHackatimeHours ?? 0));
			case 'title-asc':
				return sorted.sort((a, b) => a.project.projectTitle.localeCompare(b.project.projectTitle));
			case 'title-desc':
				return sorted.sort((a, b) => b.project.projectTitle.localeCompare(a.project.projectTitle));
			default:
				return sorted;
		}
	}

	let filteredSubmissions = $derived.by(() => {
		let filtered = submissions;

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((s) => {
				const title = s.project.projectTitle.toLowerCase();
				const user = fullName(s.project.user).toLowerCase();
				const email = s.project.user.email.toLowerCase();
				const description = (s.project.description || '').toLowerCase();
				return title.includes(query) || user.includes(query) || email.includes(query) || description.includes(query);
			});
		}

		if (selectedStatuses.size > 0) {
			filtered = filtered.filter((s) => selectedStatuses.has(s.approvalStatus));
		} else if (statusFilter !== 'all') {
			filtered = filtered.filter((s) => s.approvalStatus === statusFilter);
		}

		if (selectedProjectTypes.size > 0) {
			filtered = filtered.filter((s) => {
				const projectType = projects.find(p => p.projectId === s.project.projectId)?.projectType;
				return projectType && selectedProjectTypes.has(projectType);
			});
		}

		return sortSubmissions(filtered, sortBy);
	});

	let statusCounts = $derived({
		all: submissions.length,
		pending: submissions.filter((s) => s.approvalStatus === 'pending').length,
		approved: submissions.filter((s) => s.approvalStatus === 'approved').length,
		rejected: submissions.filter((s) => s.approvalStatus === 'rejected').length,
	});

$effect(() => {
	if (submissions.length === 0) {
		return;
	}

	submissionsLoaded = true;

	let updated = false;
	const drafts = { ...submissionDrafts };

	for (const submission of submissions) {
		if (!drafts[submission.submissionId]) {
			drafts[submission.submissionId] = toSubmissionDraft(submission);
			updated = true;
		}
	}

	if (updated) {
		submissionDrafts = drafts;
	}
});

$effect(() => {
	if (projects.length > 0) {
		projectsLoaded = true;
	}
});

$effect(() => {
	if (users.length > 0) {
		usersLoaded = true;
	}
});

	onMount(() => {
		document.documentElement.classList.add('dark');
		return () => {
			document.documentElement.classList.remove('dark');
		};
});
</script>

<svelte:head>
	<title>Admin Panel - Midnight</title>
	{@html `<script>if(typeof document!=='undefined')document.documentElement.classList.add('dark')</script>`}
</svelte:head>

<div class="min-h-screen bg-background p-6">
	<div class="max-w-7xl mx-auto space-y-8">
		<header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="text-4xl font-bold text-foreground">Admin Panel</h1>
				<p class="text-muted-foreground mt-1">Signed in as {data.user.email}</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" onclick={loadMetrics} disabled={metricsLoading}>
					<RefreshCw class="size-4 mr-2 {metricsLoading ? 'animate-spin' : ''}" />
					Refresh Totals
				</Button>
				<Button onclick={recalculateAllProjectsHours} disabled={recalcAllBusy}>
					<RotateCcw class="size-4 mr-2 {recalcAllBusy ? 'animate-spin' : ''}" />
					{recalcAllBusy ? 'Recalculating...' : 'Recalculate All Projects'}
				</Button>
			</div>
		</header>

		{#if bulkProjectError}
			<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
				{bulkProjectError}
			</div>
		{:else if bulkProjectMessage}
			<div class="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-600 dark:text-green-400">
				{bulkProjectMessage}
			</div>
		{/if}

		{#if recalculateProgress && recalculateProgress.total > 0}
			<div class="rounded-lg border border-border bg-card p-4 space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Recalculating projects...</span>
					<span class="font-medium">
						{recalculateProgress.current} / {recalculateProgress.total}
					</span>
				</div>
				<div class="w-full bg-muted rounded-full h-2 overflow-hidden">
					<div 
						class="h-full bg-primary transition-all duration-300 ease-out"
						style="width: {Math.round((recalculateProgress.current / recalculateProgress.total) * 100)}%"
					></div>
				</div>
				{#if recalculateProgress.updated > 0 || recalculateProgress.skipped > 0 || recalculateProgress.errors > 0}
					<div class="flex gap-4 text-xs text-muted-foreground">
						{#if recalculateProgress.updated > 0}
							<span class="text-green-600 dark:text-green-400">✓ {recalculateProgress.updated} updated</span>
						{/if}
						{#if recalculateProgress.skipped > 0}
							<span class="text-yellow-600 dark:text-yellow-400">⊘ {recalculateProgress.skipped} skipped</span>
						{/if}
						{#if recalculateProgress.errors > 0}
							<span class="text-destructive">✗ {recalculateProgress.errors} errors</span>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Total Hackatime Hours</CardTitle>
				</CardHeader>
				<CardContent>
					{#if metricsLoading}
						<Skeleton class="h-8 w-24" />
					{:else}
						<div class="text-2xl font-bold">{formatTotalHoursValue(metrics.totalHackatimeHours)}</div>
					{/if}
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Total Approved Hours</CardTitle>
				</CardHeader>
				<CardContent>
					{#if metricsLoading}
						<Skeleton class="h-8 w-24" />
					{:else}
						<div class="text-2xl font-bold">{formatTotalHoursValue(metrics.totalApprovedHours)}</div>
					{/if}
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Hackatime Hours on Projects with Submissions</CardTitle>
				</CardHeader>
				<CardContent>
					{#if metricsLoading}
						<Skeleton class="h-8 w-24" />
					{:else}
						<div class="text-2xl font-bold">{formatTotalHoursValue(metrics.totalHackatimeHoursOnProjectsWithSubmissions)}</div>
					{/if}
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Total Projects</CardTitle>
				</CardHeader>
				<CardContent>
					{#if metricsLoading}
						<Skeleton class="h-8 w-24" />
					{:else}
						<div class="text-2xl font-bold">{formatCount(metrics.totalProjects)}</div>
					{/if}
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Total Users</CardTitle>
				</CardHeader>
				<CardContent>
					{#if metricsLoading}
						<Skeleton class="h-8 w-24" />
					{:else}
						<div class="text-2xl font-bold">{formatCount(metrics.totalUsers)}</div>
					{/if}
				</CardContent>
			</Card>
		</section>

		<Tabs value="submissions" class="w-full" onValueChange={(value) => {
			if (value === 'submissions' && !submissionsLoaded && !submissionsLoading) {
				loadSubmissions(true);
			} else if (value === 'projects' && !projectsLoaded && !projectsLoading) {
				loadProjects();
			} else if (value === 'users' && !usersLoaded && !usersLoading) {
				loadUsers();
			}
		}}>
			<TabsList class="grid w-full max-w-md grid-cols-3">
				<TabsTrigger value="submissions">
					<FileText class="size-4 mr-2" />
					Submissions ({statusCounts.all})
				</TabsTrigger>
				<TabsTrigger value="projects">
					<FolderOpen class="size-4 mr-2" />
					Projects
				</TabsTrigger>
				<TabsTrigger value="users">
					<User class="size-4 mr-2" />
					Users
				</TabsTrigger>
			</TabsList>

			<TabsContent value="submissions" class="space-y-4">
				<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<h2 class="text-2xl font-semibold">Submission Review Platform</h2>
					<Button variant="outline" onclick={() => loadSubmissions(false)}>
						<RefreshCw class="size-4 mr-2" />
						Refresh
					</Button>
				</div>

				<Card>
					<CardContent class="p-6 space-y-4">
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-2">
								<div class="relative flex-1">
									<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
									<Input
										placeholder="Search by title, user, email, or description..."
										class="pl-9 pr-9"
										bind:value={searchQuery}
									/>
									{#if searchQuery}
				<button
											onclick={() => searchQuery = ''}
											class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
											<XIcon class="size-4" />
				</button>
									{/if}
								</div>
								<div class="flex gap-2">
								<div class="relative">
									<ArrowUpDown class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
									<select
										bind:value={sortBy}
										class="w-48 h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
									>
										<option value="date-desc">Newest First</option>
										<option value="date-asc">Oldest First</option>
										<option value="hours-desc">Most Hours</option>
										<option value="hours-asc">Least Hours</option>
										<option value="title-asc">Title A-Z</option>
										<option value="title-desc">Title Z-A</option>
									</select>
								</div>
								<Sheet bind:open={showFilterPopover}>
									<SheetTrigger>
										<Button variant="outline">
											<Filter class="size-4 mr-2" />
											Filters
											{#if selectedStatuses.size > 0 || selectedProjectTypes.size > 0}
												<Badge variant="secondary" class="ml-2">
													{selectedStatuses.size + selectedProjectTypes.size}
												</Badge>
											{/if}
										</Button>
									</SheetTrigger>
									<SheetContent>
										<div class="p-6">
											<SheetHeader>
												<SheetTitle>Filters</SheetTitle>
												<SheetDescription>
													Select filters to narrow down your search results
												</SheetDescription>
											</SheetHeader>
											<div class="space-y-6 mt-6">
											{#if selectedStatuses.size > 0 || selectedProjectTypes.size > 0}
												<Button variant="ghost" size="sm" onclick={clearAllFilters} class="w-full">
													Clear All Filters
												</Button>
												<Separator />
											{/if}
											<div class="space-y-4">
												<div class="space-y-3">
													<label class="text-sm font-medium">Submission Status</label>
													<div class="space-y-3">
														{#each statusOptions as status}
															{@const isChecked = selectedStatuses.has(status)}
															<div class="flex items-center space-x-3">
																<Checkbox
																	id={`status-${status}`}
																	checked={isChecked}
																	onclick={() => toggleStatus(status)}
																/>
																<label
																	for={`status-${status}`}
																	class="text-sm font-medium leading-none cursor-pointer flex-1 capitalize"
																	onclick={() => toggleStatus(status)}
																>
																	{status} ({statusCounts[status as keyof typeof statusCounts]})
																</label>
			</div>
														{/each}
		</div>
												</div>
												<Separator />
												<div class="space-y-3">
													<label class="text-sm font-medium">Project Type</label>
													<div class="space-y-3">
														{#each (() => {
															const availableTypes = Array.from(new Set(projects.map(p => p.projectType))).sort();
															return availableTypes.map(type => ({
																type,
																count: projects.filter(p => p.projectType === type).length,
																isChecked: selectedProjectTypes.has(type)
															}));
														})() as item}
															<div class="flex items-center space-x-3">
																<Checkbox
																	id={`type-${item.type}`}
																	checked={item.isChecked}
																	onclick={() => toggleProjectType(item.type)}
																/>
																<label
																	for={`type-${item.type}`}
																	class="text-sm font-medium leading-none cursor-pointer flex-1 capitalize"
																	onclick={() => toggleProjectType(item.type)}
																>
																	{item.type.replace(/_/g, ' ')} ({item.count})
																</label>
				</div>
														{/each}
													</div>
												</div>
											</div>
										</div>
										</div>
									</SheetContent>
								</Sheet>
							</div>
							<div class="flex flex-col sm:flex-row gap-2 items-start sm:items-center pt-2 border-t border-border">
								<span class="text-xs font-medium text-muted-foreground whitespace-nowrap">Billy Date Range:</span>
								<div class="flex gap-2 items-center flex-1">
									<Input
										id="billy-date-start"
										type="date"
										class="h-8 text-sm w-auto"
										bind:value={billyDateStart}
									/>
									<span class="text-muted-foreground text-xs">to</span>
									<Input
										id="billy-date-end"
										type="date"
										class="h-8 text-sm w-auto"
										bind:value={billyDateEnd}
									/>
								</div>
							</div>
						</div>
						{#if selectedStatuses.size > 0 || selectedProjectTypes.size > 0 || searchQuery}
							<div class="flex flex-wrap gap-2 items-center">
								{#each Array.from(selectedStatuses) as status}
									<Badge variant="secondary" class="gap-1">
										Status: {status}
					<button
											onclick={() => removeStatusFilter(status)}
											class="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
					>
											<XIcon class="size-3" />
					</button>
									</Badge>
								{/each}
								{#each Array.from(selectedProjectTypes) as type}
									<Badge variant="secondary" class="gap-1">
										Type: {type.replace('_', ' ')}
					<button
											onclick={() => removeProjectTypeFilter(type)}
											class="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
					>
											<XIcon class="size-3" />
					</button>
									</Badge>
								{/each}
								{#if searchQuery}
									<Badge variant="secondary" class="gap-1">
										Search: {searchQuery}
					<button
											onclick={() => searchQuery = ''}
											class="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
					>
											<XIcon class="size-3" />
					</button>
									</Badge>
								{/if}
								<Button variant="ghost" size="sm" onclick={clearAllFilters}>
									Clear All
								</Button>
				</div>
						{/if}
					</CardContent>
				</Card>

				{#if submissionsLoading}
					<div class="py-12 text-center text-muted-foreground">Loading submissions...</div>
				{:else if filteredSubmissions.length === 0}
					<div class="py-12 text-center text-muted-foreground">
						{statusFilter === 'all' ? 'No submissions available.' : `No ${statusFilter} submissions.`}
					</div>
				{:else}
					<div class="grid gap-3">
						{#each filteredSubmissions as submission (submission.submissionId)}
							<div class="border border-border rounded-lg bg-card overflow-hidden">
								<div class="grid md:grid-cols-[200px_1fr] gap-4 p-4">
									{#if submission.project.screenshotUrl}
										<div class="flex-shrink-0">
											<a href={submission.project.screenshotUrl} target="_blank" rel="noreferrer" class="block">
												<img 
													src={submission.project.screenshotUrl} 
													alt="Project screenshot" 
													class="w-full aspect-video object-cover rounded border hover:opacity-90 transition-opacity"
												/>
											</a>
										</div>
									{/if}
									<div class="flex-1 min-w-0 space-y-3">
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 min-w-0">
												<h3 class="text-lg font-semibold mb-1">{submission.project.projectTitle}</h3>
												{#if submission.project.description}
													<p class="text-sm text-muted-foreground line-clamp-3">{submission.project.description}</p>
												{/if}
											</div>
											<span class={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
												submission.approvalStatus === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-400' :
												submission.approvalStatus === 'rejected' ? 'bg-destructive/20 text-destructive border border-destructive' :
												'bg-yellow-500/20 text-yellow-200 border border-yellow-400'
											}`}>
												{submission.approvalStatus.toUpperCase()}
											</span>
										</div>

										<div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
											<div>
												<span class="text-muted-foreground text-xs">User:</span>
												<div class="font-medium">{fullName(submission.project.user)}</div>
												<div class="text-xs text-muted-foreground truncate">{submission.project.user.email}</div>
												{#if submission.project.user.trustLevel}
													<div class="text-xs mt-1">
														<span class={`px-1.5 py-0.5 rounded font-medium ${
															submission.project.user.trustLevel === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-400' :
															submission.project.user.trustLevel === 'green' ? 'bg-green-500/20 text-green-300 border border-green-400' :
															submission.project.user.trustLevel === 'yellow' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400' :
															submission.project.user.trustLevel === 'red' ? 'bg-red-500/20 text-red-300 border border-red-400' :
															'bg-muted text-muted-foreground border border-border'
														}`}>
															Trust: {submission.project.user.trustLevel}
														</span>
													</div>
												{/if}
											</div>
											<div>
												<span class="text-muted-foreground text-xs">Hackatime Hours:</span>
												<div class="flex items-center gap-2">
													<span class="font-semibold text-primary">{formatHours(submission.project.nowHackatimeHours)}</span>
													<button
														onclick={() => recalculateSubmissionHours(submission.submissionId, submission.project.projectId)}
														disabled={submissionRecalculating[submission.submissionId]}
														class="p-1 hover:bg-muted rounded"
														title="Recalculate"
													>
														<RotateCcw class="size-3 {submissionRecalculating[submission.submissionId] ? 'animate-spin' : ''}" />
													</button>
												</div>
												{#if submission.project.nowHackatimeProjects?.length}
													<div class="text-xs text-muted-foreground mt-1">
														Projects: {submission.project.nowHackatimeProjects.join(', ')}
													</div>
												{/if}
											</div>
											<div>
												<span class="text-muted-foreground text-xs">Submitted:</span>
												<div class="text-xs text-muted-foreground">{formatDate(submission.createdAt)}</div>
											</div>
										</div>

										<div class="flex flex-wrap gap-2 pb-2 border-b border-border">
											{#if submission.project.playableUrl}
												<a href={submission.project.playableUrl} target="_blank" rel="noreferrer" 
												   class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-sm font-medium transition-colors">
													<ExternalLink class="size-3" />
													Check Playable
												</a>
											{/if}
											{#if submission.project.repoUrl}
												<a href={submission.project.repoUrl} target="_blank" rel="noreferrer" 
												   class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-sm font-medium transition-colors">
													<ExternalLink class="size-3" />
													Check Code
												</a>
											{/if}
											{#if submission.project.screenshotUrl}
												<a href={submission.project.screenshotUrl} target="_blank" rel="noreferrer" 
												   class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-sm font-medium transition-colors">
													<ExternalLink class="size-3" />
													Full Screenshot
												</a>
											{/if}
											{#if submission.project.user.hackatimeAccount || submission.project.user.hackatimeAccountId}
												<button
													onclick={() => openBillyLink(submission.project.user.hackatimeAccountId || submission.project.user.hackatimeAccount)}
													class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted text-sm font-medium transition-colors"
													title="Open Billy link for this user's hackatime account"
												>
													<ExternalLink class="size-3" />
													Billy
												</button>
											{/if}
										</div>

										<div class="grid md:grid-cols-[120px_1fr_auto] gap-3 items-end">
											<div>
												<label for={`hours-${submission.submissionId}`} class="text-xs font-medium text-muted-foreground block mb-1">Approved Hours</label>
												<Input
													id={`hours-${submission.submissionId}`}
												type="number"
												step="0.1"
												min="0"
													class="h-9"
													placeholder={formatHours(submission.project.nowHackatimeHours)}
												bind:value={submissionDrafts[submission.submissionId].approvedHours}
											/>
										</div>
											<div>
												<label for={`justification-${submission.submissionId}`} class="text-xs font-medium text-muted-foreground block mb-1">Justification</label>
												<Input
													id={`justification-${submission.submissionId}`}
													type="text"
													class="h-9"
													placeholder="Explain approved hours..."
													bind:value={submissionDrafts[submission.submissionId].hoursJustification}
												/>
										</div>
											<div class="flex gap-2">
											{#if submission.approvalStatus !== 'approved'}
													<Button
														class="h-9"
														onclick={() => {
															submissionDrafts = {
																...submissionDrafts,
																[submission.submissionId]: {
																	...submissionDrafts[submission.submissionId],
																	approvalStatus: 'approved'
																}
															};
															saveSubmission(submission.submissionId);
														}}
													disabled={submissionSaving[submission.submissionId]}
												>
														<Check class="size-4 mr-2" />
														{submissionSaving[submission.submissionId] ? 'Saving...' : 'Approve'}
													</Button>
											{/if}
											{#if submission.approvalStatus !== 'rejected'}
													<Button
														variant="destructive"
														class="h-9"
														onclick={() => {
															submissionDrafts = {
																...submissionDrafts,
																[submission.submissionId]: {
																	...submissionDrafts[submission.submissionId],
																	approvalStatus: 'rejected',
																	approvedHours: '0'
																}
															};
															saveSubmission(submission.submissionId);
														}}
													disabled={submissionSaving[submission.submissionId]}
												>
														<X class="size-4 mr-2" />
														{submissionSaving[submission.submissionId] ? 'Saving...' : 'Reject'}
													</Button>
											{/if}
											</div>
										</div>

										{#if submission.hoursJustification}
											<div class="text-xs pt-2 border-t border-border">
												<span class="text-muted-foreground font-medium">Current Justification:</span>
												<p class="mt-1 text-muted-foreground">{submission.hoursJustification}</p>
											</div>
										{/if}

										{#if submissionErrors[submission.submissionId] || submissionSuccess[submission.submissionId]}
											<div class="text-xs">
												{#if submissionErrors[submission.submissionId]}
													<span class="text-destructive">{submissionErrors[submission.submissionId]}</span>
												{:else if submissionSuccess[submission.submissionId]}
													<span class="text-green-600 dark:text-green-400">{submissionSuccess[submission.submissionId]}</span>
												{/if}
											</div>
										{/if}
									</div>
								</div>

								{#if addressExpanded[submission.submissionId]}
									<div class="px-4 pb-4 border-t border-border pt-3 text-xs">
										<div class="flex items-center justify-between mb-2">
											<span class="text-muted-foreground font-medium">User Details</span>
											<button
												onclick={() => addressExpanded[submission.submissionId] = !addressExpanded[submission.submissionId]}
												class="text-muted-foreground hover:text-foreground"
											>
												Hide
											</button>
										</div>
										<div class="grid md:grid-cols-2 gap-x-4 gap-y-1 space-y-1">
											{#if submission.project.user.addressLine1}
												<div>{submission.project.user.addressLine1}</div>
											{/if}
											{#if submission.project.user.addressLine2}
												<div>{submission.project.user.addressLine2}</div>
											{/if}
											<div>{[submission.project.user.city, submission.project.user.state, submission.project.user.zipCode].filter(Boolean).join(', ')}</div>
											{#if submission.project.user.country}
												<div>{submission.project.user.country}</div>
											{/if}
											{#if submission.project.user.hackatimeAccount}
												<div>
													<span class="text-muted-foreground">Hackatime:</span>
													<span class="ml-1 font-mono">{submission.project.user.hackatimeAccount}</span>
										</div>
											{/if}
											{#if submission.project.user.birthday}
												<div>
													<span class="text-muted-foreground">Birthday:</span>
													<span class="ml-1">{formatDate(submission.project.user.birthday)}</span>
									</div>
											{/if}
								</div>
									</div>
								{:else}
									<div class="px-4 pb-4 border-t border-border pt-3">
										<button
											onclick={() => addressExpanded[submission.submissionId] = !addressExpanded[submission.submissionId]}
											class="text-xs text-muted-foreground hover:text-foreground"
										>
											Show User Details
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</TabsContent>

			<TabsContent value="projects" class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-semibold">Projects</h2>
					<Button variant="outline" onclick={async () => {
							await loadProjects();
							await loadUsers();
					}}>
						<RefreshCw class="size-4 mr-2" />
						Refresh
					</Button>
				</div>

				{#if projectsLoading}
					<div class="py-12 text-center text-muted-foreground">Loading projects...</div>
				{:else if projects.length === 0}
					<div class="py-12 text-center text-muted-foreground">No projects available.</div>
				{:else}
					<div class="grid gap-6">
						{#each projects as project (project.projectId)}
							<Card>
								<CardHeader>
								<div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
									<div>
											<CardTitle>{project.projectTitle}</CardTitle>
											<CardDescription>Owner: {fullName(project.user)} ({project.user.email})</CardDescription>
									</div>
										<div class="flex flex-wrap gap-2">
											<Badge variant="outline">{project.projectType}</Badge>
											<Badge variant="outline">Hackatime: {formatHours(project.nowHackatimeHours)}</Badge>
											<Badge variant={project.isLocked ? 'destructive' : 'default'}>
												{project.isLocked ? 'Locked' : 'Unlocked'}
											</Badge>
									</div>
								</div>
								</CardHeader>
								<CardContent class="space-y-4">
								{#if project.description}
										<p class="text-sm leading-relaxed">{project.description}</p>
								{/if}

								<div class="grid gap-4 md:grid-cols-3">
									<div class="space-y-2">
											<h4 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Hackatime projects</h4>
										{#if project.nowHackatimeProjects?.length}
												<ul class="text-sm list-disc list-inside space-y-1">
												{#each project.nowHackatimeProjects as name}
													<li>{name}</li>
												{/each}
											</ul>
										{:else}
												<p class="text-sm text-muted-foreground">No projects linked.</p>
										{/if}
									</div>
									<div class="space-y-2">
											<h4 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Latest submission</h4>
										{#if project.submissions.length > 0}
												<p class="text-sm">
												{project.submissions[0].approvalStatus} • {formatDate(project.submissions[0].createdAt)}
											</p>
												<p class="text-sm text-muted-foreground">
												Approved hours: {formatHours(project.submissions[0].approvedHours)}
											</p>
										{:else}
												<p class="text-sm text-muted-foreground">No submissions yet.</p>
										{/if}
									</div>
									<div class="space-y-2">
											<h4 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Links</h4>
											<div class="flex flex-col gap-2">
										{#if project.playableUrl}
													<Button variant="link" size="sm" class="justify-start p-0 h-auto" asChild>
														<a href={project.playableUrl} target="_blank" rel="noreferrer">
															Playable <ExternalLink class="size-3 ml-1" />
														</a>
													</Button>
										{/if}
										{#if project.repoUrl}
													<Button variant="link" size="sm" class="justify-start p-0 h-auto" asChild>
														<a href={project.repoUrl} target="_blank" rel="noreferrer">
															Repository <ExternalLink class="size-3 ml-1" />
														</a>
													</Button>
										{/if}
										{#if project.screenshotUrl}
													<Button variant="link" size="sm" class="justify-start p-0 h-auto" asChild>
														<a href={project.screenshotUrl} target="_blank" rel="noreferrer">
															Screenshot <ExternalLink class="size-3 ml-1" />
														</a>
													</Button>
										{/if}
											</div>
									</div>
								</div>

									<Separator />

								<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
									<div class="flex gap-3">
											<Button
												onclick={() => recalculateProject(project.projectId)}
											disabled={projectBusy[project.projectId]}
										>
												<RotateCcw class="size-4 mr-2 {projectBusy[project.projectId] ? 'animate-spin' : ''}" />
											{projectBusy[project.projectId] ? 'Processing...' : 'Recalculate hours'}
											</Button>
											<AlertDialog>
												<AlertDialogTrigger>
													<Button variant="destructive" disabled={projectBusy[project.projectId]}>
											Delete project
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Are you sure?</AlertDialogTitle>
														<AlertDialogDescription>
															This will permanently delete the project "{project.projectTitle}". This action cannot be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction onclick={() => deleteProject(project.projectId)}>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
									</div>
									<div class="text-sm">
										{#if projectErrors[project.projectId]}
												<span class="text-destructive">{projectErrors[project.projectId]}</span>
										{:else if projectSuccess[project.projectId]}
												<span class="text-green-600 dark:text-green-400">{projectSuccess[project.projectId]}</span>
										{/if}
									</div>
								</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{/if}
			</TabsContent>

			<TabsContent value="users" class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-semibold">Users</h2>
					<Button variant="outline" onclick={loadUsers}>
						<RefreshCw class="size-4 mr-2" />
						Refresh
					</Button>
				</div>

				{#if usersLoading}
					<div class="py-12 text-center text-muted-foreground">Loading users...</div>
				{:else if users.length === 0}
					<div class="py-12 text-center text-muted-foreground">No users available.</div>
				{:else}
					<div class="grid gap-6">
						{#each users as user (user.userId)}
							<Card>
								<CardHeader>
								<div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
									<div>
											<CardTitle>{fullName(user)}</CardTitle>
											<CardDescription>{user.email}</CardDescription>
									</div>
										<div class="flex flex-wrap gap-2">
											<Badge variant="outline" class="capitalize">{user.role}</Badge>
											<Badge variant={user.onboardComplete ? 'default' : 'secondary'}>
												{user.onboardComplete ? 'Onboarding complete' : 'Onboarding pending'}
											</Badge>
											<Badge variant="outline">Projects: {user.projects.length}</Badge>
									</div>
								</div>
								</CardHeader>
								<CardContent class="space-y-4">
									<div class="grid gap-4 md:grid-cols-3 text-sm">
									<div>
											<p class="text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
											<p class="text-muted-foreground">Updated {formatDate(user.updatedAt)}</p>
									</div>
									<div>
										<p>{user.addressLine1}</p>
											{#if user.addressLine2}
										<p>{user.addressLine2}</p>
											{/if}
										<p>{[user.city, user.state, user.zipCode].filter(Boolean).join(', ')}</p>
											{#if user.country}
										<p>{user.country}</p>
											{/if}
									</div>
									<div>
										<p>Hackatime: {user.hackatimeAccount ?? 'Not linked'}</p>
									</div>
								</div>

								{#if user.projects.length > 0}
										<Separator />
									<div class="space-y-3">
											<h4 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Projects</h4>
										<div class="grid gap-3">
											{#each user.projects as project (project.projectId)}
													<Card>
														<CardContent class="pt-4 space-y-2">
													<div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
														<div>
															<p class="font-medium">{project.projectTitle}</p>
																	<p class="text-xs uppercase tracking-wide text-muted-foreground">{project.projectType}</p>
														</div>
																<div class="flex flex-wrap gap-2 text-xs">
																	<Badge variant="outline" class="text-xs">Hackatime {formatHours(project.nowHackatimeHours)}</Badge>
																	<Badge variant={project.isLocked ? 'destructive' : 'default'} class="text-xs">
																		{project.isLocked ? 'Locked' : 'Unlocked'}
																	</Badge>
														</div>
													</div>
													{#if project.submissions.length > 0}
																<p class="text-xs text-muted-foreground">
															Latest submission: {project.submissions[0].approvalStatus} • {formatDate(project.submissions[0].createdAt)}
														</p>
													{:else}
																<p class="text-xs text-muted-foreground">No submissions yet.</p>
													{/if}
														</CardContent>
													</Card>
											{/each}
										</div>
									</div>
								{/if}
								</CardContent>
							</Card>
						{/each}
					</div>
				{/if}
			</TabsContent>
		</Tabs>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
