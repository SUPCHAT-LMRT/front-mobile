<script lang="ts">
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3.js';
	import {fallbackAvatarLetters} from "$lib/utils/fallbackAvatarLetters.js";

	import * as ImageCropper from '$lib/components/extra/ui/image-cropper';
	import * as Avatar from "$lib/components/ui/avatar";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { error, success } from '$lib/toast/toast.js';
	import { getFileFromUrl } from '$lib/components/extra/ui/image-cropper';
	import { type User, updateUserAvatar } from '$lib/api/user';
	import { Button } from "$lib/components/ui/button/index.js";
	import { Download, Trash2 } from 'lucide-svelte';
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';

	const {authenticatedUser}: { authenticatedUser: User } = $props();
	let forceRenderAvatar = $state(Date.now());

	const updateAvatar = async (file: File) => {
		try {
			await updateUserAvatar(file);
			forceRenderAvatar = Date.now();
			success("Succès", "Votre avatar a été mis à jour");
		} catch (e) {
			console.error(e);
			error(
				"Erreur",
				"Une erreur est survenue lors de la mise à jour de l'avatar",
			);
		}
	};

	const handleAvatarCrop = async (url: string) => {
		const file = await getFileFromUrl(url);
		await updateAvatar(file);
	};
</script>

<div class="flex flex-col gap-1 items-center justify-center">
	<div class="pt-7">
		<ImageCropper.Root onCropped={handleAvatarCrop}>
			<ImageCropper.UploadTrigger>
				<Avatar.Root
					class="size-30 rounded-xl border-2 border-gray-200 cursor-pointer transition-opacity">
					<Avatar.Image
						src={`${getS3ObjectUrl(S3Bucket.USERS_AVATARS, authenticatedUser.id)}?${forceRenderAvatar}`}
					/>
					<Avatar.Fallback>
						<div
							class="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500 text-2xl font-bold rounded-full"
						>
							{fallbackAvatarLetters(
								authenticatedUser.firstName +
								" " +
								authenticatedUser.lastName,
							)}
						</div>
					</Avatar.Fallback>
				</Avatar.Root>
			</ImageCropper.UploadTrigger>
			<ImageCropper.Dialog>
				<ImageCropper.Cropper cropShape="round" aspect={1}/>
				<ImageCropper.Controls>
					<ImageCropper.Cancel/>
					<ImageCropper.Crop/>
				</ImageCropper.Controls>
			</ImageCropper.Dialog>
		</ImageCropper.Root>
	</div>
	<div class="flex w-full max-w-sm flex-col gap-1.5">
		<Label for="name" class="text-gray-700 pt-2">Nom</Label>
		<Input disabled type="name" id="name" value={authenticatedUser.lastName} />
	</div>
	<div class="flex w-full max-w-sm flex-col gap-1.5">
		<Label for="firstName" class="text-gray-700 pt-2">Prénom</Label>
		<Input disabled type="firstName" id="firstName" value={authenticatedUser.firstName} />
	</div>
	<div class="flex w-full max-w-sm flex-col gap-1.5">
		<Label for="email" class="text-gray-700 pt-2">Email</Label>
		<Input disabled type="email" id="email" value={authenticatedUser.email} />
	</div>
	<div class="flex w-full max-w-sm flex-col gap-2.5 pt-10">
		<Button variant="outline" size="sm">
			<Download />
			Exporter mes données
		</Button>
		<AlertDialog.Root>
			<AlertDialog.Trigger >
				<Button variant="outline" size="sm" class="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
					<Trash2 />
					Supprimer mes données
				</Button>
			</AlertDialog.Trigger>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Etes-vous sûr ?</AlertDialog.Title>
					<AlertDialog.Description>
						Cette action supprimera définitivement vos données et ne pourra pas être annulée.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
					<AlertDialog.Action class={cn(buttonVariants({ variant: "outline" }), " border-red-500 text-red-500 hover:bg-red-500 hover:text-white")}>Supprimer</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</div>
</div>