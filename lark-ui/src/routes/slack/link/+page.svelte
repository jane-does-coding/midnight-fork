<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { checkAuthStatus } from '$lib/auth';

	let loading = $state(true);
	let success = $state(false);
	let error = $state('');
	let token = $state('');

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		token = urlParams.get('token') || '';

		if (!token) {
			error = 'No token provided. Please use the link from Slack.';
			loading = false;
			return;
		}

		const authStatus = await checkAuthStatus();
		if (!authStatus) {
			error = 'Please log in to your Midnight account first.';
			loading = false;
			return;
		}

		try {
			const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
			const response = await fetch(`${apiUrl}/api/user/slack/link`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				success = true;
				setTimeout(() => {
					goto('/app');
				}, 2000);
			} else {
				error = data.message || 'Failed to link Slack account.';
			}
		} catch (e) {
			error = 'An error occurred while linking your account.';
		} finally {
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
	<div class="max-w-md w-full rounded-2xl border border-gray-700 bg-gray-900/70 backdrop-blur p-8 space-y-6 text-center">
		{#if loading}
			<div class="space-y-4">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
				<p class="text-gray-300">Linking your Slack account...</p>
			</div>
		{:else if success}
			<div class="space-y-4">
				<div class="text-6xl">✅</div>
				<h1 class="text-2xl font-bold text-white">Successfully Linked!</h1>
				<p class="text-gray-300">Your Slack account is now linked to your Midnight account. You'll receive notifications when your submissions are reviewed.</p>
				<p class="text-sm text-gray-400">Redirecting to dashboard...</p>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="text-6xl">❌</div>
				<h1 class="text-2xl font-bold text-white">Link Failed</h1>
				<p class="text-gray-300">{error}</p>
				<div class="flex gap-3 justify-center">
					<a
						href="/login"
						class="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
					>
						Log In
					</a>
					<a
						href="/app"
						class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
					>
						Go to Dashboard
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>


