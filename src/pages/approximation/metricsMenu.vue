<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" location="top" :activator="'parent'">
            <v-card min-width="350" min-height="225" class="px-4 py-2">
                <v-card-title class="px-2">

                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 12px; font-weight: 600;">
                            Метрики
                        </span>
                        <v-spacer></v-spacer>

                        <v-btn elevation="0" @click="menu = false">
                            <span style="font-size: 11px;">
                                Закрыть
                            </span>
                        </v-btn>
                    </div>


                </v-card-title>

                <v-card-text class="pb-0">
                    <v-row class="">
                        <v-col class="pb-0" cols="12">
                            <v-list density="compact" style="height: 150px; ">
                                <v-list-item class="px-0" v-for="(key, index) of Object.keys(metrics)" :key="index">
                                    <span>
                                        {{ `${key}: ${metrics[key]}` }}
                                    </span>
                                </v-list-item>
                            </v-list>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-menu>
    </div>
</template>

<script>

export default {
    data() {
        return {
            menu: false,
        }
    },
    props: {
        metrics: {
            type: Object
        },
    },
    methods: {
        switchMenu() {
            this.menu = !this.menu;
            if (this.menu) {
                this.settingsClone = structuredClone(this.settings);
            }
        },

    }
}
</script>

<style scoped></style>