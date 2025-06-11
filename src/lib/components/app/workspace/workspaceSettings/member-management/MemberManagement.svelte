<script lang="ts">
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import type { WorkspaceMember } from '$lib/api/workspace/member';
	import { checkRolePermission, RolePermission } from '$lib/api/workspace/roles';
	import {
		getWorkspaceMembers,
		kickWorkspaceMember,
		type Workspace
	} from '$lib/api/workspace/workspace';
	import InviteMemberDialog from '$lib/components/app/workspace/InviteMemberDialog.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters.js';
	import { AlertTriangle, MoreHorizontal, UserMinus } from 'lucide-svelte';

	const { workspace }: { workspace: Workspace } = $props();

	let members: WorkspaceMember[] = $state([]);
	let hasPermission = $derived.by(async () => {
		if (!workspace) return false;

		try {
			const { hasPermission: canManageMembers } = await checkRolePermission(
				workspace.id,
				RolePermission.KICK_MEMBERS.permissionBit
			);
			return canManageMembers;
		} catch (err) {
			console.error('Erreur lors de la vérification des permissions :', err);
			return false;
		}
	});
	let forceRenderAvatar = $state(Date.now());

	$effect(() => {
		const fetchMembers = async () => {
			try {
				const data = await getWorkspaceMembers(workspace.id, 1, 100);
				members = data.members;
			} catch (error) {
				console.error('Erreur lors de la récupération des membres :', error);
			}
		};

		fetchMembers();
	});

	const handleRemoveMember = async (memberId: string) => {
		try {
			await kickWorkspaceMember(workspace.id, memberId);
			members = members.filter((member) => member.id !== memberId);
		} catch (error) {
			console.error('Erreur lors de la suppression du membre :', error);
		}
	};
</script>

{#if !hasPermission}
	<div class="space-y-6">
		<div class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
			<div class="flex">
				<AlertTriangle class="h-5 w-5 text-red-800 dark:text-red-500" />
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800 dark:text-red-500">Accès refusé</h3>
					<div class="mt-2 text-sm text-red-700 dark:text-red-400">
						<p>
							Vous n'avez pas les permissions nécessaires pour gérer les membres de cet espace de
							travail.
							<br />
							Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Gestion des Membres</h2>
			<Button class="text-white">
				<InviteMemberDialog workspaceId={workspace.id} />
			</Button>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Liste des membres</CardTitle>
				<CardDescription>Gérez les membres de votre espace de travail</CardDescription>
			</CardHeader>
			<CardContent>
				<!-- Vue mobile : cartes empilées -->
				<div class="flex flex-col gap-4 sm:hidden">
					{#each members as member}
						<div
							class="bg-background flex items-center justify-between rounded-lg border p-4 shadow-sm"
						>
							<div class="flex items-center gap-4">
								<Avatar.Root class="h-12 w-12">
									<Avatar.Image
										src={`${getS3ObjectUrl(S3Bucket.USERS_AVATARS, member.userId)}?${forceRenderAvatar}`}
									/>
									<Avatar.Fallback>
										<div
											class="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-500"
										>
											{fallbackAvatarLetters(member.pseudo)}
										</div>
									</Avatar.Fallback>
								</Avatar.Root>
								<span class="text-base font-medium">{member.pseudo}</span>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<Button variant="ghost" size="icon">
										<MoreHorizontal class="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onclick={() => handleRemoveMember(member.id)}
										class="text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white"
									>
										<UserMinus class="mr-2 h-4 w-4" />
										Retirer du workspace
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					{/each}
				</div>

				<!-- Vue desktop : tableau -->
				<div class="hidden sm:block">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-24">Avatar</TableHead>
								<TableHead class="w-24">Nom</TableHead>
								<TableHead class="w-24 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each members as member}
								<TableRow>
									<TableCell class="w-24">
										<Avatar.Root>
											<Avatar.Image
												src={`${getS3ObjectUrl(S3Bucket.USERS_AVATARS, member.userId)}?${forceRenderAvatar}`}
											/>
											<Avatar.Fallback>
												<div
													class="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500"
												>
													{fallbackAvatarLetters(member.pseudo)}
												</div>
											</Avatar.Fallback>
										</Avatar.Root>
									</TableCell>
									<TableCell class="w-24">
										<div class="flex items-center gap-2">
											{member.pseudo}
										</div>
									</TableCell>
									<TableCell class="w-24 text-right">
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button variant="ghost" size="icon">
													<MoreHorizontal class="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuItem
													onclick={() => handleRemoveMember(member.id)}
													class="text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white"
												>
													<UserMinus class="mr-2 h-4 w-4" />
													Retirer du workspace
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
