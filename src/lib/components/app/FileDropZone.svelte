<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import { FileIcon, UploadIcon, XIcon } from '@lucide/svelte';

	type Props = {
		accept?: string;
		multiple?: boolean;
		maxSize?: number; // in bytes
		disabled?: boolean;
		class?: string;
		filesSelected?: (files: File[]) => void;
		error?: (message: string) => void;
	};

	let {
		accept = '*/*',
		multiple = false,
		maxSize = 10 * 1024 * 1024, // 10MB default
		disabled = false,
		class: className = '',
		filesSelected = () => {},
		error = () => {}
	}: Props = $props();

	let dragOver = $state(false);
	let fileInput: HTMLInputElement;
	let selectedFiles: File[] = $state([]);

	function handleDragOver(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		dragOver = false;
	}

	function handleDrop(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		dragOver = false;

		const files = Array.from(event.dataTransfer?.files || []);
		processFiles(files);
	}

	function handleFileSelect(event: Event) {
		if (disabled) return;
		const target = event.target as HTMLInputElement;
		const files = Array.from(target.files || []);
		processFiles(files);
	}

	function processFiles(files: File[]) {
		const validFiles: File[] = [];
		const errors: string[] = [];

		for (const file of files) {
			// Check file size
			if (file.size > maxSize) {
				errors.push(`${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}.`);
				continue;
			}

			// Check file type if accept is specified and not wildcard
			if (accept !== '*/*' && !isFileTypeAccepted(file, accept)) {
				errors.push(`${file.name} is not an accepted file type.`);
				continue;
			}

			validFiles.push(file);
		}

		if (errors.length > 0) {
			error(errors.join(' '));
			return;
		}

		if (validFiles.length > 0) {
			if (multiple) {
				selectedFiles = [...selectedFiles, ...validFiles];
			} else {
				selectedFiles = [validFiles[0]];
			}
			filesSelected(selectedFiles);
		}

		// Reset input
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
		filesSelected(selectedFiles);
	}

	function clearFiles() {
		selectedFiles = [];
		filesSelected(selectedFiles);
	}

	function openFileDialog() {
		if (disabled) return;
		fileInput?.click();
	}

	function isFileTypeAccepted(file: File, acceptString: string): boolean {
		const acceptTypes = acceptString.split(',').map((type) => type.trim());

		return acceptTypes.some((acceptType) => {
			if (acceptType.startsWith('.')) {
				return file.name.toLowerCase().endsWith(acceptType.toLowerCase());
			}
			if (acceptType.includes('/*')) {
				const [mainType] = acceptType.split('/');
				return file.type.startsWith(mainType);
			}
			return file.type === acceptType;
		});
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class={cn('space-y-4', className)}>
	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		{multiple}
		{disabled}
		class="hidden"
		onchange={handleFileSelect}
	/>

	<!-- Drop zone -->
	<Card
		class={cn(
			'relative border-2 border-dashed p-8 text-center transition-colors',
			dragOver && !disabled && 'border-primary bg-primary/5',
			disabled && 'cursor-not-allowed opacity-50',
			!disabled && 'hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
		)}
		role="button"
		tabindex={disabled ? -1 : 0}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		onclick={openFileDialog}
		onkeydown={(e) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
				e.preventDefault();
				openFileDialog();
			}
		}}
	>
		<div class="flex flex-col items-center gap-4">
			<div
				class={cn(
					'rounded-full p-4 transition-colors',
					dragOver && !disabled ? 'bg-primary text-primary-foreground' : 'bg-muted'
				)}
			>
				<UploadIcon class="h-8 w-8" />
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-semibold">
					{dragOver && !disabled ? 'Glissez vos fichiers' : 'Téléversez vos fichiers'}
				</h3>
				<p class="text-muted-foreground text-sm">
					Déposez vos fichiers ici ou choisissez-les depuis votre appareil.
				</p>
				{#if accept !== '*/*'}
					<p class="text-muted-foreground text-xs">
						Formats acceptés: {accept}
					</p>
				{/if}
				<p class="text-muted-foreground text-xs">
					Taille de fichier maximum: {formatFileSize(maxSize)}
				</p>
			</div>
		</div>
	</Card>

	<!-- Selected files -->
	{#if selectedFiles.length > 0}
		<Card class="p-4">
			<div class="mb-3 flex items-center justify-between">
				<h4 class="text-sm font-medium">
					Fichiers sélectionnés ({selectedFiles.length})
				</h4>
				<Button variant="ghost" size="sm" onclick={clearFiles}>Tout supprimer</Button>
			</div>

			<div class="space-y-2">
				{#each selectedFiles as file, index}
					<div class="bg-muted/50 flex items-center justify-between rounded border p-2">
						<div class="flex min-w-0 flex-1 items-center gap-2">
							<FileIcon class="text-muted-foreground h-4 w-4 flex-shrink-0" />
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{file.name}</p>
								<p class="text-muted-foreground text-xs">
									{formatFileSize(file.size)}
								</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							class="h-8 w-8 flex-shrink-0 p-0"
							onclick={() => removeFile(index)}
						>
							<XIcon class="h-4 w-4" />
							<span class="sr-only">Supprimer</span>
						</Button>
					</div>
				{/each}
			</div>
		</Card>
	{/if}
</div>
