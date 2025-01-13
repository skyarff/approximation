<template>
    <v-tabs v-model="path">
        <v-tab v-for="(route, idx) in routes" :key="idx" :text="route.name" :value="route.path" />
    </v-tabs>
</template>

<script>

import { routes } from '@/router/routes.js'

export default {
    data() {
        return {
            path: routes[0].path,
            routes: routes
        }
    },
    created() {
        this.$router.push(this.path)
    },
    watch: {
        path(newVal) {
            this.$router.push(newVal)
        } 
    }
}

</script>

<style scoped>

</style>