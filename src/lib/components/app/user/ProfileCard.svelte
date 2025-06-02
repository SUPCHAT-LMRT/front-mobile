<script lang="ts">
    import {getS3ObjectUrl, S3Bucket} from "$lib/api/s3";
    import {PrivateStatus, type User, updateUserAvatar} from "$lib/api/user";
    import * as Avatar from "$lib/components/ui/avatar";
    import {Button} from "$lib/components/ui/button";
    import {Card} from "$lib/components/ui/card";
    import {cn} from "$lib/utils";
    import {fallbackAvatarLetters} from "$lib/utils/fallbackAvatarLetters.js";
    import * as ImageCropper from '$lib/components/extra/ui/image-cropper';
    import {getFileFromUrl} from '$lib/components/extra/ui/image-cropper';
    import {error, success} from "$lib/toast/toast";

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

<section class="py-2 pt-8">
    <div class="mx-auto w-[600px]">
        <div class="relative">
            <div class="h-28 bg-blue-100 rounded-t-lg"></div>

            <div
                    class="absolute bottom-0 left-6 transform translate-y-1/2 flex items-end"
            >
                <div class="relative group">
                    <ImageCropper.Root onCropped={handleAvatarCrop}>
                        <ImageCropper.UploadTrigger>
                            <Avatar.Root
                                    class="size-24 rounded-full border-4 border-gray-200 cursor-pointer transition-opacity">
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

                    <div
                            class={cn(
              "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-gray-200",
              {
                "bg-green-500":
                  authenticatedUser.status === PrivateStatus.ONLINE,
                "bg-yellow-500":
                  authenticatedUser.status === PrivateStatus.AWAY,
                "bg-red-500":
                  authenticatedUser.status === PrivateStatus.DO_NOT_DISTURB,
                "bg-gray-500":
                  authenticatedUser.status === PrivateStatus.OFFLINE ||
                  authenticatedUser.status === PrivateStatus.INVISIBLE,
              },
            )}
                    ></div>
                </div>
            </div>
        </div>

        <Card
                class="mt-16 bg-white border border-gray-200 text-gray-800 p-6 shadow-sm max-w-3xl mx-auto"
        >
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-sm font-medium text-gray-500 uppercase">
                            prénom nom
                        </div>
                        <div>
                            {authenticatedUser.firstName}
                            {authenticatedUser.lastName}
                        </div>
                    </div>
                    <Button
                            variant="secondary"
                            class="bg-gray-200 hover:bg-gray-300 text-gray-700"
                            size="sm"
                    >
                        Modifier
                    </Button>
                </div>

                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-sm font-medium text-gray-500 uppercase">
                            E-MAIL
                        </div>
                        <div class="flex items-center gap-2">
                            <span>{authenticatedUser.email}</span>
                        </div>
                    </div>
                    <Button
                            variant="secondary"
                            class="bg-gray-200 hover:bg-gray-300 text-gray-700"
                            size="sm"
                    >
                        Modifier
                    </Button>
                </div>
            </div>
        </Card>
    </div>
</section>