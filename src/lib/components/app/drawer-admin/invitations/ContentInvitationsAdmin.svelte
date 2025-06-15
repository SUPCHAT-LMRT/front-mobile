<script lang="ts">
	import {Button, buttonVariants} from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "$lib/components/ui/card";
	import {onMount} from "svelte";
	import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "$lib/components/ui/table";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import {success, notifyByLevel} from "$lib/toast/toast";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from "$lib/components/ui/dropdown-menu";
	import { ClipboardCopy, MoreHorizontal, Plus, UserMinus } from 'lucide-svelte';
	import {getInviteLink, deleteInviteLink, createInviteLink} from "$lib/api/admin";
	import { writable } from "svelte/store";

	let inviteLInk = $state([]);

	let alertOpen = $state(false);
	let linkToRemove: string | null = $state(null);
	let openMenuFor = $state(null);

	let isDialogOpen = $state(false);
	let firstName = $state("");
	let lastName = $state("");
	let email = $state("");

	const inviteLink = writable<string>("");

	function onClickDelete(token: string) {
		openMenuFor = null;
		linkToRemove = token;
		alertOpen = true;
	}

	const copyFullLink = () => {
		inviteLink.subscribe((link) => {
			if (link) {
				navigator.clipboard.writeText(link)
					.then(() => success("Lien copié", "Le lien d'invitation a été copié."))
					.catch((err) => console.error("Erreur copie lien :", err));
			}
		})();
	};

	const copyToken = () => {
		inviteLink.subscribe((link) => {
			if (link) {
				let token = "";
				if (link.includes("token=")) {
					token = link.split("token=")[1];
				} else {
					const parts = link.split("/");
					token = parts[parts.length - 1];
				}
				navigator.clipboard.writeText(token)
					.then(() => success("Token copié", "Le token a été copié."))
					.catch((err) => console.error("Erreur copie token :", err));
			}
		})();
	};

	onMount(async () => {
		try {
			const data = await getInviteLink();
			inviteLInk = data.map((invite) => ({
				email: invite.email,
				token: invite.token,
				expiresAt: new Date(invite.expiresAt).toLocaleDateString("fr-FR", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit"
				})
			}));
		} catch (error) {
			console.error("Erreur lors de la récupération des invitations :", error);
		}
	});

	async function handleRemoveInviteLink() {
		if (linkToRemove) {
			try {
				await deleteInviteLink(linkToRemove);
				inviteLInk = inviteLInk.filter((invite) => invite.token !== linkToRemove);
				alertOpen = false;
				linkToRemove = null;
				success("Succès", "L'invitation a été supprimée avec succès.");
			} catch (error) {
				console.error("Erreur lors de la suppression de l'invitation :", error);
				notifyByLevel({
					title: "Erreur",
					level: "error",
					message: "Une erreur est survenue lors de la suppression de l'invitation."
				});
			}
		}
	}

	async function handleCreateInviteLink() {
		if (!firstName || !lastName || !email) {
			notifyByLevel({ title: "Erreur", level: "error", message: "Tous les champs sont requis." });
			return;
		}
		try {
			const generatedLink: string = await createInviteLink(firstName, lastName, email);
			inviteLink.set(generatedLink);
			success("Succès", "Invitation créée avec succès.");
		} catch (error) {
			console.error("Erreur lors de la création de l'invitation :", error);
			notifyByLevel({
				title: "Erreur",
				level: "error",
				message: "Une erreur est survenue lors de la création de l'invitation."
			});
		}
	}

	function shortenLink(link: string): string {
		const maxLength = 40;
		return link.length > maxLength
			? link.slice(0, 20) + "..." + link.slice(-5)
			: link;
	}

</script>

<div class="space-y-6 px-2">
	<div class="flex justify-between items-center">
		<h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200">Gestion des invitations</h2>
	</div>

	<Card>
		<CardHeader>
			<CardTitle class="text-gray-700 dark:text-gray-200">Liste des invitations en cours</CardTitle>
			<div class="flex justify-between items-center">
				<CardDescription>Gérez les invitations de votre application</CardDescription>
				<Dialog.Root bind:open={isDialogOpen}>
					<Dialog.Trigger class={buttonVariants({ variant: "outline" })}>
						<Plus />
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[425px]">
						<Dialog.Header>
							<Dialog.Title>Invitez un utilisateur</Dialog.Title>
							<Dialog.Description>
								Remplissez les informations de l'utilisateur à inviter.
							</Dialog.Description>
						</Dialog.Header>
						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="name" class="text-right">Nom</Label>
								<Input id="name" bind:value={lastName} class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="username" class="text-right">Prénom</Label>
								<Input id="username" bind:value={firstName} class="col-span-3" />
							</div>
							<div class="grid grid-cols-4 items-center gap-4">
								<Label for="mail" class="text-r ight">Mail</Label>
								<Input id="mail" type="email" bind:value={email} class="col-span-3" />
							</div>
						</div>

						{#if $inviteLink}
							<div class="mt-2 flex flex-col gap-2">
								<div class="flex items-center justify-between gap-2 p-3 border rounded-md bg-gray-100 dark:bg-gray-700">
									<span class="text-sm truncate dark:text-gray-300">{shortenLink($inviteLink)}</span>
								</div>
								<div class="flex gap-2">
									<Button onclick={copyFullLink} class="p-2 bg-[#61A0AF] text-white rounded-md hover:bg-[#4B7986]" aria-label="Copier le lien complet">
										Copier le lien
									</Button>
									<Button onclick={copyToken} class="p-2 bg-[#61A0AF] text-white rounded-md hover:bg-[#4B7986]" aria-label="Copier le token">
										Copier le code du lien
									</Button>
								</div>
							</div>
						{/if}

						<Dialog.Footer>
							<Button type="button" variant="outline" onclick={handleCreateInviteLink}>
								Créer l'invitation
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="w-24">Adresse mail</TableHead>
						<TableHead class="w-24">Date expiration</TableHead>
						<TableHead class="w-24 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each inviteLInk as invite}
						<TableRow>
							<TableCell>{invite.email}</TableCell>
							<TableCell>{invite.expiresAt}</TableCell>
							<TableCell class="text-right">
								<DropdownMenu open={openMenuFor === invite.token} onopenChange={(e) => openMenuFor = e.detail ? invite.token : null}>
									<DropdownMenuTrigger>
										<MoreHorizontal class="h-4 w-4" />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem class="text-red-500" onclick={() => onClickDelete(invite.token)}>
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
			<AlertDialog.Description> Cette action est irréversible.</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleRemoveInviteLink} class="text-red-500 bg-white border border-red-500 hover:bg-red-500 hover:text-white">
				Supprimer
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
