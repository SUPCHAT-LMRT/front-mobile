<script lang="ts">
    import * as Tabs from "$lib/components/ui/tabs";
    import {goto} from "$lib/utils/goto";
    import {page} from "$app/state";

    type Tab = {
        displayName: string;
        label: string;
    }

    let activeTab: Tab = $state(null);

    switch (page.route.id) {
        case "/(auth)/user/account":
            activeTab = {displayName: "Mon compte", label: "account"};
            break;
        case "/(auth)/user/connection":
            activeTab = {displayName: "Connexion", label: "connections"};
            break;
    }

    function handleTabChange(tab: Tab, url: string) {
        goto(url);
        activeTab = tab;
    }

    let { children } = $props();
</script>

<section class="ml-15 border-l-2 border-gray-200 dark:border-gray-800 dark:bg-gray-800 w-full">
        <div class="flex flex-col px-4 py-2">
            <section>
                <div class="flex items-end mb-4">
                    <h1 class="text-3xl font-bold text-gray-700 dark:text-gray-200">Paramètres</h1>
                    <span class="mx-2 mb-1">-</span>
                    <span class="text-gray-700 text-lg font-semibold dark:text-gray-200">{activeTab.displayName}</span>
                </div>
            </section>

            <section>
                <div>
                    <Tabs.Root value={activeTab.label}>
                        <Tabs.List class="ml-auto dark:bg-gray-900">
                            <Tabs.Trigger value="account" class="text-gray-600 dark:text-gray-200" onclick={() => handleTabChange({displayName: "Mon compte", label: "account"}, "/user/account")}>
                                Mon compte
                            </Tabs.Trigger>
                            <Tabs.Trigger value="connections" class="text-gray-600 dark:text-gray-200" onclick={() => handleTabChange({displayName: "Connexion", label: "connections"}, "/user/connection")}>
                                Connexion
                            </Tabs.Trigger>
                        </Tabs.List>
                    </Tabs.Root>
                </div>
            </section>
            <div class="flex">
                <div class="min-w-1/2">
                    {@render children?.()}
                </div>
            </div>

        </div>

</section>