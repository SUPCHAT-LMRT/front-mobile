<script lang="ts">
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from "$lib/components/ui/dropdown-menu";
	import { MoreHorizontal, UserMinus, UserPen } from "lucide-svelte";
	import { listAllUsers, deleteUser as apiDeleteUser, updateUser } from "$lib/api/user";
	import { getS3ObjectUrl, S3Bucket } from "$lib/api/s3";
	import { fallbackAvatarLetters } from "$lib/utils/fallbackAvatarLetters.js";

	type UserItem = { id: string; name: string; email: string };
	let users: UserItem[] = $state([]);

	let openMenuFor = $state(null);
	let userToModify: string | null = $state(null);
	let userToRemove: string | null = $state(null);
	let modifyUserOpen = $state(false);
	let alertOpen = $state(false);
	let userName = $state("");
	let firstName = $state("");
	let lastName = $state("");
	let email = $state("");
	let isSubmitting = $state(false);
	let errorMessage = $state("");

	onMount(async () => {
		try {
			const data = await listAllUsers();
			users = data.map(u => ({
				id: u.id,
				name: `${u.firstName} ${u.lastName}`,
				email: u.email
			}));
		} catch (err) {
			console.error(err);
		}
	});

	function onClickModify(user: UserItem) {
		openMenuFor = null;
		userToModify = user.id;
		modifyUserOpen = true;
		userName = user.name;
		const [firstN, ...lastN] = user.name.split(" ");
		firstName = firstN || "";
		lastName = lastN.join(" ") || "";
		email = user.email;
	}

	function onClickDelete(id: string) {
		openMenuFor = null;
		userToRemove = id;
		alertOpen = true;
	}

	async function handleSubmit() {
		if (!userToModify || !firstName.trim() || !lastName.trim() || !email.trim()) {
			errorMessage = "Veuillez remplir tous les champs";
			return;
		}

		isSubmitting = true;
		errorMessage = "";

		try {
			await updateUser(
				userToModify,
				firstName.trim(),
				lastName.trim(),
				email.trim()
			);

			// Mise à jour de la liste des utilisateurs
			users = users.map(u => {
				if (u.id === userToModify) {
					return {
						...u,
						name: `${firstName.trim()} ${lastName.trim()}`,
						email: email.trim()
					};
				}
				return u;
			});

			modifyUserOpen = false;
			firstName = "";
			lastName = "";
			email = "";
			userToModify = null;
		} catch (err) {
			console.error("Erreur lors de la modification :", err);
			errorMessage = "Une erreur est survenue lors de la modification";
		} finally {
			isSubmitting = false;
		}
	}

	async function confirmRemove() {
		if (!userToRemove) return;
		try {
			await apiDeleteUser(userToRemove);
			users = users.filter(u => u.id !== userToRemove);
		} catch (err) {
			console.error("Erreur lors de la suppression :", err);
		} finally {
			alertOpen = false;
			userToRemove = null;
		}
	}
</script>

<div class="space-y-6 px-2">
	<div class="flex justify-between items-center">
		<h2 class="text-xl font-semibold text-gray-700">Gestion des utilisateurs</h2>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Liste des utilisateurs</CardTitle>
			<CardDescription>Gérez les utilisateurs de votre application</CardDescription>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Avatar</TableHead>
						<TableHead>Nom</TableHead>
						<TableHead>Email</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each users as user}
						<TableRow>
							<TableCell>
								<Avatar.Root>
									<Avatar.Image
										src={`${getS3ObjectUrl(S3Bucket.USERS_AVATARS, user.id)}?${Date.now()}`}
									/>
									<Avatar.Fallback>
										<div class="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500 font-bold rounded-full">
											{fallbackAvatarLetters(user.name)}
										</div>
									</Avatar.Fallback>
								</Avatar.Root>
							</TableCell>
							<TableCell>{user.name}</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell class="text-right">
								<DropdownMenu
									open={openMenuFor === user.id}
									onopenChange={(e: CustomEvent<boolean>) => {
                                        openMenuFor = e.detail ? user.id : null;
                                    }}
								>
									<DropdownMenuTrigger>
										<Button variant="ghost" size="icon">
											<MoreHorizontal class="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem onclick={() => {onClickModify(user)}}>
											<UserPen class="mr-2 h-4 w-4"/> Modifier
										</DropdownMenuItem>
										<DropdownMenuItem
											class="text-red-500"
											onclick={() => onClickDelete(user.id)}
										>
											<UserMinus class="mr-2 h-4 w-4 text-red-500"/> Supprimer
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>

<AlertDialog.Root bind:open={alertOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Êtes-vous sûr ?</AlertDialog.Title>
			<AlertDialog.Description>
				Cette action est irréversible. Vous allez supprimer définitivement cet utilisateur.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmRemove} class="text-red-500 bg-white border border-gray-200 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white">
				Supprimer
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<Dialog.Root bind:open={modifyUserOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Modifier l'utilisateur</Dialog.Title>
			<Dialog.Description>
				Modifiez les informations de l'utilisateur {userName}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}>
			<div class="grid gap-4 py-4">
				{#if errorMessage}
					<div class="text-red-500 text-sm mb-2">
						{errorMessage}
					</div>
				{/if}

				<div class="grid grid-cols-4 items-center gap-4">
					<label for="firstName" class="text-right">
						Prénom
					</label>
					<input
						id="firstName"
						class="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
						bind:value={firstName}
						required
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<label for="lastName" class="text-right">
						Nom
					</label>
					<input
						id="lastName"
						class="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
						bind:value={lastName}
						required
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<label for="email" class="text-right">
						Email
					</label>
					<input
						id="email"
						type="email"
						class="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
						bind:value={email}
						required
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Dialog.Close>
					<Button type="button" variant="outline">Annuler</Button>
				</Dialog.Close>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						Enregistrement...
					{:else}
						Enregistrer
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>