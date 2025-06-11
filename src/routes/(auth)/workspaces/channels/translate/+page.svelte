<script lang="ts">
    import {onMount} from 'svelte';
    import {toast} from 'svelte-sonner';
    import {getSupportedLanguages, translateText} from "$lib/api/translate";
    import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "$lib/components/ui/card";
    import {Button} from "$lib/components/ui/button";
    import {Label} from "$lib/components/ui/label";
    import {ArrowLeft, Loader2} from 'lucide-svelte';
    import {page} from "$app/state";

    let inputText = $state('');
    let outputText = $state('');
    let sourceLang = $state('fr');
    let targetLang = $state('en');
    let languages: { code: string, name: string }[] = $state([]);
    let isLoading = $state(false);

    let currentChannelId = $state(page.params.channelId);

    onMount(async () => {
        try {
            languages = await getSupportedLanguages();
        } catch (error) {
            toast.error("Erreur lors du chargement des langues");
            console.error("Erreur lors du chargement des langues :", error);
        }
    });

    async function handleTranslate() {
        if (!inputText.trim()) {
            toast.error("Veuillez entrer du texte à traduire");
            return;
        }

        isLoading = true;
        try {
            outputText = await translateText(inputText, sourceLang, targetLang);
            toast.success("Traduction effectuée avec succès");
        } catch (error) {
            toast.error("Erreur lors de la traduction");
            console.error("Erreur lors de la traduction :", error)
        } finally {
            isLoading = false;
        }
    }

    const handleBack = () => {
        window.location.href = `/direct?channelId=${currentChannelId}`;
    };
</script>

<div class="container mx-auto p-2">
    <div class="space-y-4">
        <div class="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onclick={handleBack} class="h-8 w-8">
                <ArrowLeft class="h-4 w-4"/>
            </Button>
            <h2 class="text-xl font-semibold">Traducteur</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card>
                <CardHeader class="pb-2">
                    <CardTitle class="text-base">Texte source</CardTitle>
                    <CardDescription class="text-xs">Entrez le texte à traduire</CardDescription>
                </CardHeader>
                <CardContent class="space-y-2 p-2">
                    <div class="flex justify-between items-center">
                        <Label for="sourceLang" class="text-xs">Langue source</Label>
                        <select
                          id="sourceLang"
                          bind:value={sourceLang}
                          class="w-32 rounded-md border-input bg-background text-xs ring-offset-background
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {#each languages as lang}
                                <option value={lang.code}>{lang.name}</option>
                            {/each}
                        </select>
                    </div>

                    <textarea
                      bind:value={inputText}
                      class="w-full h-[120px] rounded-md border border-input bg-background px-2 py-1 text-xs
                               ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Entrez le texte à traduire..."
                    ></textarea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader class="pb-2">
                    <CardTitle class="text-base">Traduction</CardTitle>
                    <CardDescription class="text-xs">Résultat de la traduction</CardDescription>
                </CardHeader>
                <CardContent class="space-y-2 p-2">
                    <div class="flex justify-between items-center">
                        <Label for="targetLang" class="text-xs">Langue cible</Label>
                        <select
                          id="targetLang"
                          bind:value={targetLang}
                          class="w-32 rounded-md border-input bg-background text-xs ring-offset-background
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {#each languages as lang}
                                <option value={lang.code}>{lang.name}</option>
                            {/each}
                        </select>
                    </div>

                    <textarea
                      readonly
                      value={outputText}
                      class="w-full h-[120px] rounded-md border border-input bg-muted px-2 py-1 text-xs
                               ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Traduction..."
                    ></textarea>
                </CardContent>
            </Card>
        </div>

        <div class="flex justify-center">
            <Button
              onclick={handleTranslate}
              disabled={isLoading}
              class="min-w-[160px] h-9 text-sm"
            >
                {#if isLoading}
                    <span class="inline-flex items-center">
                        <Loader2 class="animate-spin -ml-1 mr-3 h-4 w-4"/>
                        Traduction en cours...
                    </span>
                {:else}
                    Traduire
                {/if}
            </Button>
        </div>
    </div>
</div>
