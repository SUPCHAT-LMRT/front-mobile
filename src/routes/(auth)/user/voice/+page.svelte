<script lang="ts">
    import * as Select from "$lib/components/ui/select/index.js";
    import { Slider } from "$lib/components/ui/slider";
    import { onMount } from "svelte";
    import TestAudio from "./TestAudio.svelte";

    let inputVolume = $state(50);
    let outputVolume = $state(50);

    let audioInputs = $state([]);
    let audioOutputs = $state([]);
    let selectedInput = $state("");
    let selectedOutput = $state("");

    async function getAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            audioInputs = devices
                .filter(device => device.kind === "audioinput")
                .map(device => ({
                    value: device.deviceId,
                    label: device.label || "Microphone inconnu",
                }));

            audioOutputs = devices
                .filter(device => device.kind === "audiooutput")
                .map(device => ({
                    value: device.deviceId,
                    label: device.label || "Sortie inconnue",
                }));

            if (audioInputs.length > 0) {
                selectedInput = audioInputs[0].value;
            }
            if (audioOutputs.length > 0) {
                selectedOutput = audioOutputs[0].value;
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des périphériques audio:", error);
        }
    }

    onMount(() => {
        getAudioDevices();
    });
</script>


<section class="px-4 py-2 ml-2 pt-8 w-[500px]">
    <h1 class="text-gray-700 text-lg font-semibold mb-5 dark:text-gray-200">Paramètres vocaux</h1>
    <div class="flex flex-col item-center mb-5">
        <div class="flex flex-col mr-4 w-72">
            <h2 class="text-gray-700 text-xs font-bold uppercase mb-3 dark:text-gray-200">Périphérique d'entrée</h2>
            <Select.Root type="single" name="audioInput" bind:value={selectedInput}>
                <Select.Trigger>
                    {#if selectedInput}
                        {audioInputs.find((input) => input.value === selectedInput)?.label ?? "Sélectionner une entrée"}
                    {:else}
                        Sélectionner une entrée
                    {/if}
                </Select.Trigger>
                <Select.Content>
                    <Select.Group>
                        <Select.GroupHeading>Entrées disponibles</Select.GroupHeading>
                        {#each audioInputs as input}
                            <Select.Item value={input.value} label={input.label}>
                                {input.label}
                            </Select.Item>
                        {/each}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
            <Slider type="single" bind:value={inputVolume} max={100} step={1} class="w-72 mt-4 mb-10" />
        </div>

        <div class="flex flex-col w-72">
            <h2 class="text-gray-700 text-xs font-bold uppercase mb-3">Périphérique de sortie</h2>
            <Select.Root type="single" name="audioOutput" bind:value={selectedOutput}>
                <Select.Trigger>
                    {#if selectedOutput}
                        {audioOutputs.find((output) => output.value === selectedOutput)?.label ?? "Sélectionner une sortie"}
                    {:else}
                        Sélectionner une sortie
                    {/if}
                </Select.Trigger>
                <Select.Content>
                    <Select.Group>
                        <Select.GroupHeading>Sorties disponibles</Select.GroupHeading>
                        {#each audioOutputs as output}
                            <Select.Item value={output.value} label={output.label}>
                                {output.label}
                            </Select.Item>
                        {/each}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
            <Slider type="single" bind:value={outputVolume} max={100} step={1} class="w-72 mt-4" />
        </div>

        <TestAudio />

    </div>
</section>

