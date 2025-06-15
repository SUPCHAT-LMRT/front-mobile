<script>
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { FileText, Shield, Calendar, Users } from 'lucide-svelte';
</script>

<svelte:head>
    <title>Conditions Générales d'Utilisation - SUPCHAT-LMRT</title>
    <meta name="description" content="Conditions générales d'utilisation de SUPCHAT-LMRT - Application de communication d'équipe" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <FileText class="h-6 w-6 text-blue-600" />
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Conditions Générales d'Utilisation
                    </h1>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Informations générales -->
        <Card class="mb-6">
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <Shield class="h-5 w-5 text-blue-600" />
                    Informations générales
                </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar class="h-4 w-4" />
                    <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
                </div>
                <p class="text-gray-700 dark:text-gray-300">
                    Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation de l'application -LMRT,a été
                    développée pour améliorer la communication interne et la collaboration entre équipes.
                </p>
            </CardContent>
        </Card>

        <!-- Sections des CGU -->
        <div class="space-y-6">
            <!-- Article 1 -->
            <Card>
                <CardHeader>
                    <CardTitle>Article 1 - Objet</CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                    <p class="text-gray-700 dark:text-gray-300">
                        SUPCHAT-LMRT est une application de communication d'équipe permettant aux utilisateurs de :
                    </p>
                    <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                        <li>Créer et rejoindre des espaces de travail</li>
                        <li>Communiquer via des canaux publics et privés</li>
                        <li>Partager des fichiers et collaborer en temps réel</li>
                        <li>Gérer les permissions et les rôles utilisateurs</li>
                    </ul>
                </CardContent>
            </Card>

            <!-- Article 2 -->
            <Card>
                <CardHeader>
                    <CardTitle>Article 2 - Acceptation des conditions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-gray-700 dark:text-gray-300">
                        L'utilisation de SUPCHAT-LMRT implique l'acceptation pleine et entière des présentes CGU.
                        Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'application.
                    </p>
                </CardContent>
            </Card>

            <!-- Article 3 -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <Users class="h-5 w-5 text-blue-600" />
                        Article 3 - Inscription et compte utilisateur
                    </CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                    <p class="text-gray-700 dark:text-gray-300">
                        Pour utiliser SUPCHAT-LMRT, vous devez créer un compte en fournissant des informations exactes et à jour.
                    </p>
                    <div class="space-y-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Méthodes de connexion acceptées :</h4>
                        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                            <li>Création d'un compte SUPCHAT-LMRT avec email et mot de passe</li>
                            <li>Connexion via OAuth2 (Google, Github)</li>
                        </ul>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300">
                        Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                    </p>
                </CardContent>
            </Card>

            <!-- Article 4 -->
            <Card>
                <CardHeader>
                    <CardTitle>Article 4 - Utilisation de l'application</CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                    <p class="text-gray-700 dark:text-gray-300">
                        L'utilisation de SUPCHAT-LMRT doit se faire dans le respect des lois en vigueur et des règles de bonne conduite.
                    </p>
                    <div class="space-y-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">Il est interdit de :</h4>
                        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                            <li>Publier du contenu illégal, offensant ou inapproprié</li>
                            <li>Usurper l'identité d'autrui</li>
                            <li>Utiliser l'application à des fins commerciales non autorisées</li>
                            <li>Tenter de pirater ou compromettre la sécurité de l'application</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <!-- Article 5 -->
            <Card>
                <CardHeader>
                    <CardTitle>Article 5 - Protection des données personnelles</CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                    <p class="text-gray-700 dark:text-gray-300">
                        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.
                    </p>
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p class="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Exportation des données :</strong> Vous pouvez exporter vos données personnelles
                            depuis les paramètres de votre compte, conformément à la réglementation RGPD.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <!-- Article 6 -->
            <Card>
                <CardHeader>
                    <CardTitle>Article 6 - Responsabilités</CardTitle>
                </CardHeader>
                <CardContent class="space-y-3">
                    <p class="text-gray-700 dark:text-gray-300">
                        Nous nous efforcons de maintenir l'application disponible et sécurisée,
                        mais ne peut garantir un fonctionnement sans interruption.
                    </p>
                    <p class="text-gray-700 dark:text-gray-300">
                        L'utilisateur est responsable du contenu qu'il publie et partage sur l'application.
                    </p>
                </CardContent>
            </Card>

            <!-- Article 7 -->
            <Card>
                <CardHeader>
                    <CardTitle>Article 7 - Modification des CGU</CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-gray-700 dark:text-gray-300">
                        Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés
                        des modifications par notification dans l'application.
                    </p>
                </CardContent>
            </Card>

            <!-- Article 8 -->
            <Card>
                <CardHeader>
                    <CardTitle>Article 8 - Contact</CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-gray-700 dark:text-gray-300">
                        Pour toute question concernant ces CGU, vous pouvez contacter :
                    </p>
                    <div class="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>SUPCHAT-LMRT</strong><br>
                            Email : supinfo@supinfo.com<br>
                            Téléphone : +33 (0)6 23 45 67 89
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2024 SUPCHAT-LMRT. Tous droits réservés.</p>
        </div>
    </main>
</div>