<script>
    import { onMount } from 'svelte';
    import {Button} from "$lib/components/ui/button";


    let audioContext;
    let analyser;
    let microphone;
    let dataArray;
    let isTesting = $state(false);
    let volume = $state(0);

    onMount(async () => {
        audioContext = new (window.AudioContext || window.AudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    });

    async function toggleMicrophoneTest() {
        if (isTesting) {
            stopMicrophoneTest();
        } else {
            await startMicrophoneTest();
        }
    }

    async function startMicrophoneTest() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            isTesting = true;
            requestAnimationFrame(updateVolume);
        } catch (err) {
            console.error('Erreur lors de l\'accès au micro:', err);
        }
    }

    function stopMicrophoneTest() {
        if (microphone) {
            microphone.disconnect();
            isTesting = false;
        }
    }

    function updateVolume() {
        if (!isTesting) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = dataArray.reduce((acc, val) => acc + val, 0);
        volume = sum / dataArray.length;

        requestAnimationFrame(updateVolume);
    }
</script>

<div class="mt-10">
    <h2 class="text-gray-700 text-xs font-bold uppercase mb-2">Test du micro</h2>
    <p class="text-gray-700 text-sm mt-3">Des problèmes de micro ? Fait un test pour qu'on puisse entendre ta douce voix !</p>
    <Button onclick={toggleMicrophoneTest} class="bg-[#61A0AF] hover:bg-[#4B7986] text-white rounded">
        {isTesting ? 'Arrêter le test' : 'Tester le micro'}
    </Button>
    <div class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div
                    class="bg-[#61A0AF] h-2.5 rounded-full"
                    style={`width: ${volume}%`}
            ></div>
        </div>
    </div>
</div>