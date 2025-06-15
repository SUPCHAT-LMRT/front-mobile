<script lang="ts">
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3.js';
	import {fallbackAvatarLetters} from "$lib/utils/fallbackAvatarLetters.js";

	import * as ImageCropper from '$lib/components/extra/ui/image-cropper';
	import * as Avatar from "$lib/components/ui/avatar";
	import { error, success } from '$lib/toast/toast.js';
	import { getFileFromUrl } from '$lib/components/extra/ui/image-cropper';
	import { type User, updateUserAvatar, PrivateStatus } from '$lib/api/user';
	import { cn } from '$lib/utils';
	import ModeButton from '$lib/components/buttons/ModeButton.svelte';

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

<div class="fixed top-4 right-4 z-50">
	<ModeButton />
</div>

<div class="relative group">
	<ImageCropper.Root onCropped={handleAvatarCrop}>
		<ImageCropper.UploadTrigger>
			<Avatar.Root
				class="size-20 rounded-xl border-2 border-gray-200 cursor-pointer transition-opacity">
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
			<ImageCropper.Cropper cropShape="round" aspect={1} />
			<ImageCropper.Controls>
				<ImageCropper.Cancel />
				<ImageCropper.Crop />
			</ImageCropper.Controls>
		</ImageCropper.Dialog>
	</ImageCropper.Root>

	<!-- Status color circle -->
	<div
		class={cn(
			"absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-gray-200",
			{
				"bg-green-500": authenticatedUser.status === PrivateStatus.ONLINE,
				"bg-yellow-500": authenticatedUser.status === PrivateStatus.AWAY,
				"bg-red-500": authenticatedUser.status === PrivateStatus.DO_NOT_DISTURB,
				"bg-gray-500": authenticatedUser.status === PrivateStatus.OFFLINE ||
					authenticatedUser.status === PrivateStatus.INVISIBLE,
			},
		)}
	></div>
</div>