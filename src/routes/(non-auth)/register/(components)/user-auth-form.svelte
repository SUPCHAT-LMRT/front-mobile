<script lang="ts">
  import { page } from "$app/state";
  import {
    PUBLIC_API_OAUTH_FACEBOOK_URL,
    PUBLIC_API_OAUTH_GOOGLE_URL,
  } from "$env/static/public";
  import { getInviteLinkData, registerUser } from "$lib/api/user";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { notifyByLevel, success } from "$lib/toast/toast";
  import { goto } from "$lib/utils/goto";
  import { Loader } from "lucide-svelte";
  import { onMount } from "svelte";

  let isSubmitting = $state(false);
  let email = $state("");
  let password = $state("");
  let passwordConfirmation = $state("");
  let firstName = $state("");
  let lastName = $state("");

  const token = $derived(page.url.searchParams.get("token") || "");

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|\\:;"'<>,.\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|\\:;"'<>,.\/]{8,}$/;

  onMount(async () => {
    try {
      const inviteData = await getInviteLinkData(token);
      email = inviteData.email;
      firstName = inviteData.firstName;
      lastName = inviteData.lastName;
    } catch (error) {
      console.error("Error fetching invite link data:", error);
    }
  });

  async function onSubmit() {
    isSubmitting = true;

    // TODO disabled, (code works but not needed for now)
    // if (!passwordRegex.test(password)) {
    //   notifyByLevel({
    //     title: "Mot de passe invalide",
    //     level: "error",
    //     message:
    //       "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.",
    //   });
    //   isSubmitting = false;
    //   return;
    // }

    try {
      const response = await registerUser(
        token,
        password,
        passwordConfirmation,
      );
      console.log("User registered successfully:", response);
      goto("/login");
      success("Inscription réussie !", "Votre compte a bien été créé.");
    } catch (error) {
      console.error("Error registering user:", error);
      const errorData = error.response?.data || {};
      const title = "Erreur lors de l'inscription";
      const level: "warning" | "error" = errorData.level || "error";
      const message = errorData.messageDisplay || "Une erreur est survenue";
      notifyByLevel({ title, level, message });
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if token}
  <div class="grid gap-6">
    <Button href="/login" variant="ghost" class="absolute right-2 top-2">
      Se connecter
    </Button>
    <form onsubmit={onSubmit}>
      <div class="grid gap-2">
        <div class="grid gap-1">
          <Label class="sr-only" for="email">Email</Label>
          <Input
            id="email"
            placeholder="nom@example.com"
            type="email"
            autocapitalize="none"
            autocomplete="email"
            autocorrect="off"
            bind:value={email}
            disabled={true}
          />
          <Label class="sr-only" for="password">Mot de passe</Label>
          <Input
            id="password"
            placeholder="Mot de passe"
            type="password"
            bind:value={password}
            disabled={isSubmitting}
          />
          <Label class="sr-only" for="password"
            >Confirmation du mot de passe</Label
          >
          <Input
            id="passwordConfirmation"
            placeholder="Confirmation du mot de passe"
            type="password"
            bind:value={passwordConfirmation}
            disabled={isSubmitting}
          />
          <Label class="sr-only" for="firstName">Prénom</Label>
          <div class="flex gap-1">
            <Input
              id="firstName"
              placeholder="Prénom"
              type="text"
              bind:value={firstName}
              disabled={true}
            />
            <Label class="sr-only" for="lastName">Nom</Label>
            <Input
              id="lastName"
              placeholder="Nom"
              type="text"
              bind:value={lastName}
              disabled={true}
            />
          </div>
        </div>
        <Button
          class="bg-[#61A0AF] dark:text-white"
          type="submit"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <Loader class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          S'enregistrer
        </Button>
      </div>
    </form>

    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <span class="w-full border-t"></span>
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span
          class="bg-background dark:bg-gray-900 text-muted-foreground px-2 dark:text-white"
        >
          Ou continuer avec
        </span>
      </div>
    </div>

    <div class="flex gap-1">
      <Button
        class="w-full"
        href="{PUBLIC_API_OAUTH_GOOGLE_URL}?token={token}"
        variant="outline"
        type="button"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <Loader class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          width="30"
          height="30"
          viewBox="0 0 48 48"
        >
          <path
            fill="#fbc02d"
            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12    s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20    s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
          ></path><path
            fill="#e53935"
            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039    l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
          ></path><path
            fill="#4caf50"
            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36    c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
          ></path><path
            fill="#1565c0"
            d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571    c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
          ></path>
        </svg>
        Google
      </Button>
      <Button
        class="w-full"
        href="{PUBLIC_API_OAUTH_FACEBOOK_URL}?token={token}"
        variant="outline"
        type="button"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <Loader class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          width="31"
          height="31"
          viewBox="0 0 48 48"
        >
          <path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"
          ></path><path
            fill="#fff"
            d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"
          ></path>
        </svg>
        Facebook
      </Button>
    </div>
  </div>
{:else}
  <div class="text-center">
    <p class="text-red-500">Le lien d'invitation est invalide ou manquant.</p>
    <Button href="/login" variant="ghost">Se connecter</Button>
  </div>
{/if}
