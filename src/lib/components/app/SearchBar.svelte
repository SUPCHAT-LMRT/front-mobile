<script lang="ts">
	import { baseClient } from "$lib/api/client";
	import { getS3ObjectUrl, S3Bucket } from "$lib/api/s3";
	import * as Avatar from "$lib/components/ui/avatar";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Skeleton } from "$lib/components/ui/skeleton";
	import { cn } from "$lib/utils";
	import { fallbackAvatarLetters } from "$lib/utils/fallbackAvatarLetters";
	import { Hash, Volume1 } from "lucide-svelte";

	// Define TypeScript types matching your API
	type SearchResultKind = "channel" | "message" | "user" | "group";

	type SearchResult = {
		kind: SearchResultKind;
		data:
			| SearchResultChannel
			| SearchResultMessage
			| SearchResultUser
			| SearchResultGroup;
	};

	type SearchResultChannel = {
		id: string;
		name: string;
		topic: string;
		kind: "text" | "voice";
		href: string;
	};

	type SearchResultMessage = {
		id: string;
		content: string;
		authorId: string;
		authorName: string;
		href: string;
	};

	type SearchResultUser = {
		id: string;
		highlightedFirstName: string;
		highlightedLastName: string;
		highlightedEmail: string;
		firstName: string;
		lastName: string;
		email: string;
		href: string;
	};

	type SearchResultGroup = {
		id: string;
		highlightedName: string;
		name: string;
		href: string;
	};

	// Fonction pour transformer les URLs de l'ancien vers le nouveau format
	const transformUrl = (oldUrl: string): string => {
		// Regex pour matcher l'ancien format des canaux
		const channelRegex = /\/workspaces\/([^\/]+)\/channels\/([^\/]+)/;
		const channelMatch = oldUrl.match(channelRegex);

		if (channelMatch) {
			const [, workspaceId, channelId] = channelMatch;
			return `/workspaces/channels?workspaceId=${workspaceId}&channelId=${channelId}`;
		}

		return oldUrl;
	};

	const listSearchResults = async (term: string): Promise<SearchResult[]> => {
		if (term === "") return [];
		try {
			const response = await baseClient.get(
				`/api/search?q=${term}&kind=${kindFilter ?? ""}`,
			);

			return response.data.map((result: SearchResult) => ({
				...result,
				data: {
					...result.data,
					href: transformUrl(result.data.href)
				}
			}));
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	let dialogSearchOpen = $state(false);
	let searchQuery = $state("");
	let kindFilter = $state<SearchResultKind | null>(null);
	let searchResults = $derived(listSearchResults(searchQuery));

	const closeDialogSearch = () => {
		dialogSearchOpen = false;
		searchQuery = "";
	};
</script>

<Dialog.Root bind:open={dialogSearchOpen}>
	<Dialog.Trigger
		class="flex items-center w-2/3 px-2 py-1 rounded-md bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 hover:bg-gray-200 transition dark:bg-gray-700 dark:border-gray-600"
	>
		<span class="text-gray-700 text-sm dark:text-gray-300">Rechercher</span>
	</Dialog.Trigger>
	<Dialog.Content
		class="flex flex-col justify-center items-center max-w-[30rem] dark:bg-gray-800"
	>
		<Dialog.Header>
			<Dialog.Title class="relative">
				<Input
					type="text"
					placeholder="Que souhaites-tu chercher ?"
					bind:value={searchQuery}
					class="max-w-xs dark:bg-gray-800 border border-gray-400 dark:focus-visible:bg-red"
				/>
			</Dialog.Title>
			<Dialog.Description class="flex items-center pt-2">
				<p class="text-[#1C9B4B] font-extrabold text-[11px] uppercase">
					Conseil de pro :
				</p>
				<p class="text-[11px]">
					Utilise
					<button
						class={cn(
              "p-1 bg-gray-200 dark:bg-gray-700 font-bold rounded",
              kindFilter === "message" && "!bg-green-500 text-white",
            )}
						onclick={() =>
              (kindFilter = kindFilter === "message" ? null : "message")}
					>
						Message
					</button>
					,
					<button
						class={cn(
              "p-1 bg-gray-200 dark:bg-gray-700 font-bold rounded",
              kindFilter === "channel" && "!bg-green-500 text-white",
            )}
						onclick={() =>
              (kindFilter = kindFilter === "channel" ? null : "channel")}
					>
						Canal
					</button>
					,
					<button
						class={cn(
              "p-1 bg-gray-200 dark:bg-gray-700 font-bold rounded",
              kindFilter === "user" && "!bg-green-500 text-white",
            )}
						onclick={() => (kindFilter = kindFilter === "user" ? null : "user")}
					>
						Utilisateur
					</button>
					et
					<button
						class={cn(
              "p-1 bg-gray-200 dark:bg-gray-700 font-bold rounded",
              kindFilter === "group" && "!bg-green-500 text-white",
            )}
						onclick={() =>
              (kindFilter = kindFilter === "group" ? null : "group")}
					>
						Groupe
					</button>
					pour affiner les résultats.
				</p>
			</Dialog.Description>
		</Dialog.Header>

		{#await searchResults}
			<div class="mt-4">
				<Skeleton class="h-8 w-full" />
				<Skeleton class="h-8 w-full" />
				<Skeleton class="h-8 w-full" />
			</div>
		{:then results}
			<!-- Search Results Display -->
			{#if results.length > 0}
				<div class="w-full max-h-60 overflow-y-auto mt-4">
					{#each results as result}
						<a
							href={result.data.href}
							class="block p-2 border-b rounded-sm hover:!bg-gray-600 border-gray-200 dark:border-gray-700"
							onclick={closeDialogSearch}
						>
							{#if result.kind === "channel"}
                <span
									class="text-xs font-semibold text-gray-500 dark:text-gray-400"
								>
                  Canal
                </span>
								{@render renderChannel(result.data)}
							{:else if result.kind === "message"}
                <span
									class="text-xs font-semibold text-gray-500 dark:text-gray-400"
								>
                  Message
                </span>
								{@render renderMessage(result.data)}
							{:else if result.kind === "user"}
                <span
									class="text-xs font-semibold text-gray-500 dark:text-gray-400"
								>
                  Utilisateur
                </span>
								{@render renderUser(result.data)}
							{:else if result.kind === "group"}
                <span
									class="text-xs font-semibold text-gray-500 dark:text-gray-400"
								>
                  Groupe
                </span>
								{@render renderGroup(result.data)}
							{/if}
						</a>
					{/each}
				</div>
			{:else if searchQuery}
				<div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
					Aucun résultat trouvé
				</div>
			{/if}
		{/await}
	</Dialog.Content>
</Dialog.Root>

{#snippet renderChannel(data: SearchResultChannel)}
	{@const Icon = data.kind === "text" ? Hash : Volume1}
	<span class="text-sm flex items-center">
    <Icon size={14} />
    <span>{@html data.name} {@html data.topic ? `(${data.topic})` : ""}</span>
  </span>
{/snippet}

{#snippet renderMessage(data: SearchResultMessage)}
	<div>
		<div class="flex items-center gap-x-2">
			<Avatar.Root class="flex-shrink-0">
				<Avatar.Image
					src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, data.authorId)}
				/>
				<Avatar.Fallback
				>{fallbackAvatarLetters(data.authorName)}</Avatar.Fallback
				>
			</Avatar.Root>
			<span>{data.authorName}</span>
		</div>

		<span class="mt-4 text-sm">{@html data.content}</span>
	</div>
{/snippet}

{#snippet renderUser(data: SearchResultUser)}
	<div>
		<div class="flex items-center gap-x-2">
			<Avatar.Root class="flex-shrink-0">
				<Avatar.Image src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, data.id)} />
				<Avatar.Fallback class="bg-primary"
				>{fallbackAvatarLetters(data.firstName)}</Avatar.Fallback
				>
			</Avatar.Root>
			<span
			>{@html data.highlightedFirstName}
				{@html data.highlightedLastName}</span
			>
		</div>

		<span class="mt-4 text-sm">{@html data.highlightedEmail}</span>
	</div>
{/snippet}

{#snippet renderGroup(data: SearchResultGroup)}
  <span class="text-sm">
    {@html data.highlightedName}
  </span>
{/snippet}