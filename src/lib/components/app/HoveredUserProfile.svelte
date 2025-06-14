<script lang="ts">
	import { RoomKind } from '$lib/api/room';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import { getUserProfile, PublicStatus, type UserProfile } from '$lib/api/user';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { cn } from '$lib/utils';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters';
	import { Maximize2, MessageCircle, Phone, Video } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		userId: string;
		children?: Snippet;
		self: boolean;
	};

	const { userId, children, self }: Props = $props();

	let popoverOpened = $state(false);
	let openedData: { opened: boolean; data: UserProfile | null } = $state({
		opened: false,
		data: null
	});

	function handleSeeMore(userProfile: UserProfile) {
		popoverOpened = false;
		openedData = { opened: true, data: userProfile };
	}
</script>

<div>
	<Popover.Root bind:open={popoverOpened}>
		<Popover.Trigger class="w-full">{@render children?.()}</Popover.Trigger>
		<Popover.Content>
			{#await getUserProfile(userId)}
				<div class="flex flex-col gap-y-4">
					<div class="flex items-center gap-x-2">
						<Skeleton class="size-12 rounded-full" />
						<Skeleton class="h-6 w-20 rounded-lg" />
					</div>

					{#if !self}
						<!-- Quick actions -->
						<div class="flex items-center gap-x-4 text-gray-600 dark:text-gray-400">
							<Skeleton class="size-6 rounded-full" />
							<Skeleton class="size-6 rounded-full" />
							<Skeleton class="size-6 rounded-full" />
						</div>
					{/if}

					<!-- More details -->
					<div class="flex flex-col gap-y-2">
						<div class="flex items-center gap-x-2">
							<Skeleton class="h-6 w-20 rounded-lg" />
							<Skeleton class="h-6 w-40 rounded-lg" />
						</div>
						<div class="flex items-center gap-x-2">
							<Skeleton class="h-6 w-20 rounded-lg" />
							<Skeleton class="h-6 w-40 rounded-lg" />
						</div>
					</div>
				</div>
			{:then userProfile}
				<div class="flex flex-col gap-y-4">
					<div
						class="flex items-center gap-x-2"
						onclick={() => handleSeeMore(userProfile)}
						role="button"
						tabindex="-1"
					>
						<div class="relative size-12">
							<Avatar.Root>
								<Avatar.Image
									src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, userId)}
									alt="Avatar de {userProfile.firstName} {userProfile.lastName}"
								/>
								<Avatar.Fallback class="bg-primary text-white">
									{fallbackAvatarLetters(userProfile.firstName + ' ' + userProfile.lastName)}
								</Avatar.Fallback>
							</Avatar.Root>
							<span
								class={cn('absolute right-2 bottom-2 size-3 rounded-full', {
									'bg-green-500': userProfile.status === PublicStatus.ONLINE,
									'bg-yellow-500': userProfile.status === PublicStatus.AWAY,
									'bg-red-500': userProfile.status === PublicStatus.DO_NOT_DISTURB,
									'bg-gray-500': userProfile.status === PublicStatus.OFFLINE
								})}
							>
							</span>
						</div>

						<span class="text-black dark:text-white"
							>{userProfile.firstName} {userProfile.lastName}</span
						>
					</div>

					{#if !self}
						<!-- Quick actions -->
						<div class="flex items-center gap-x-4 text-gray-600 dark:text-gray-400">
							<a
								title="Envoyer un message"
								href="/chat/{RoomKind.DIRECT.toLowerCase()}?chatId={userId}"
							>
								<MessageCircle strokeWidth={1.5} />
							</a>
							<button title="Appeler">
								<Phone strokeWidth={1.5} />
							</button>
							<button title="Vidéo">
								<Video strokeWidth={1.5} />
							</button>
						</div>
					{/if}

					<!-- More details -->
					<div class="flex flex-col gap-y-2">
						<div class="flex items-center gap-x-2">
							<span class="text-gray-600 dark:text-gray-400">Email:</span>
							<a href="mailto:{userProfile.email}" class="text-black dark:text-white"
								>{userProfile.email}</a
							>
						</div>
						<div class="flex items-center gap-x-2">
							<span class="text-gray-600 dark:text-gray-400">Poste:</span>
							<span class="text-black dark:text-white"
								>{userProfile?.jobsNames || 'Aucun poste'}</span
							>
						</div>
					</div>

					<!-- See more -->
					<div class="flex justify-end">
						<button
							class="text-primary flex items-center gap-x-2"
							onclick={() => handleSeeMore(userProfile)}
						>
							<span>Voir plus</span>
							<Maximize2 strokeWidth={1.5} size={17} class="translate-y-[2px]" />
						</button>
					</div>
				</div>
			{:catch error}
				<div class="text-red-700">{error}</div>
			{/await}
		</Popover.Content>
	</Popover.Root>

	<Dialog.Root bind:open={openedData.opened}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Description>
					{@const userProfile = openedData.data}
					{#if userProfile}
						<div class="flex flex-col gap-y-4">
							<div class="flex items-center gap-x-2">
								<Avatar.Root class="size-14">
									<Avatar.Image
										src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, userId)}
										alt="Avatar de {userProfile.firstName} {userProfile.lastName}"
									/>
									<Avatar.Fallback class="bg-primary text-lg text-white">
										{fallbackAvatarLetters(userProfile.firstName + ' ' + userProfile.lastName)}
									</Avatar.Fallback>
								</Avatar.Root>

								<span class="text-lg text-black dark:text-white"
									>{userProfile.firstName} {userProfile.lastName}</span
								>
							</div>

							{#if !self}
								<!-- Quick actions -->
								<div class="flex items-center gap-x-4 text-gray-600 dark:text-gray-400">
									<a
										title="Envoyer un message"
										href="/chat/{RoomKind.DIRECT.toLowerCase()}/{userId}"
									>
										<MessageCircle strokeWidth={1.5} />
									</a>
									<button title="Appeler">
										<Phone strokeWidth={1.5} />
									</button>
									<button title="Vidéo">
										<Video strokeWidth={1.5} />
									</button>
								</div>
							{/if}

							<!-- More details -->
							<div class="flex flex-col gap-y-2">
								<div class="flex items-center gap-x-2">
									<span class="text-gray-600 dark:text-gray-400">Email:</span>
									<a href="mailto:{userProfile.email}" class="text-black dark:text-white"
										>{userProfile.email}</a
									>
								</div>
								<div class="flex items-center gap-x-2">
									<span class="text-gray-600 dark:text-gray-400">Poste:</span>
									<span class="text-black dark:text-white"
										>{userProfile?.jobsNames || 'Aucun poste'}</span
									>
								</div>
							</div>
						</div>
					{/if}
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>
</div>
