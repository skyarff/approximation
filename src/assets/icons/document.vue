<template>
    <svg :width="size" :height="size" :viewBox="`0 0 24 24`" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M3 7C3 4.23858 5.23858 2 8 2H16C18.7614 2 21 4.23858 21 7V17C21 19.7614 18.7614 22 16 22H8C5.23858 22 3 19.7614 3 17V7Z"
            :stroke="color" stroke-width="1.5" />
        <path d="M8 8.19995H16" :stroke="color" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round"
            stroke-linejoin="round" />
        <path d="M8 12.2H16" :stroke="color" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round"
            stroke-linejoin="round" />
        <path d="M9 16.2H15" :stroke="color" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round"
            stroke-linejoin="round" />
    </svg>

</template>

<script>
export default {
    props: {
        color: {
            type: String,
            default: '#fff',
        },
        size: {
            type: Number,
            default: 24
        }
    },
};
</script>

<style scoped>
.part1 {
    fill: v-bind('color');
}
</style>