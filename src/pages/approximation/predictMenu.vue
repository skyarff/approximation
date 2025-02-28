<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" location="start" :activator="'parent'">
            <v-card min-width="350" class="px-4 py-2">
                <v-card-title class="px-2">

                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 12px; font-weight: 600;">
                            Предсказать значение
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
                        <v-col cols="12">
                            <v-list density="compact" style="height: 160px; ">
                                <v-form ref="form1">
                                    <v-list-item class="px-0" v-for="(variable, index) in dataInfo.fields.slice(1)"
                                        :key="index">
                                        <v-text-field class="pt-2" :hide-details="true" variant="outlined"
                                            :rules="[v => (v === 0 || !!v) || 'Поле обязательно']"
                                            v-model="predictInfo.predictData[0][variable]" :label="variable">
                                            <template #label>
                                                <div style="font-size: 11px;">
                                                    {{ variable }}
                                                </div>
                                            </template>
                                        </v-text-field>

                                    </v-list-item>
                                </v-form>
                            </v-list>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field :hide-details="true" variant="outlined" v-model="predictInfo.predictAns"
                                readonly>
                                <template #label>
                                    <div style="font-size: 11px;">
                                        Предсказание
                                    </div>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>



                <v-card-actions>
                    <v-spacer></v-spacer>


                    <v-btn @click="predict" :hide-details="true">
                        <span style="font-size: 11px;">
                            Предсказать
                        </span>
                    </v-btn>

                </v-card-actions>
            </v-card>
        </v-menu>
    </div>
</template>


<script setup>
import { calculatePredicted } from '@/app_lib/metrics';
import { ref, reactive } from 'vue';

const props = defineProps({
    dataInfo: {
        type: Object
    },
    allBases: {
        type: Object
    }
});


let menu = ref(false);
function switchMenu() {
    menu.value = !menu.value;
};


const predictInfo = reactive({
    predictData: [{}],
    predictAns: ''
});
const form1 = ref(null);
async function predict() {
    const isValid = await form1.value.validate();
    if (isValid) {
        predictInfo.predictAns =
            calculatePredicted([predictInfo.predictData[0]], props.allBases)
                .map(ans => ans.toFixed(4))
                .join(', ');
    } else
        alert('Вы не заполнили форму?');
};



defineExpose({
    switchMenu,
    predict
});

</script>


<style scoped></style>