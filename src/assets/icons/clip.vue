<template>
    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path class="clip_icon"
            d="M18.7975 9.11975L10.0355 17.8817C8.08291 19.8344 4.91709 19.8344 2.96447 17.8817C1.01184 15.9291 1.01184 12.7633 2.96447 10.8107L11.0962 2.67893C12.463 1.3121 14.6791 1.3121 16.0459 2.67893C17.4128 4.04577 17.4128 6.26185 16.0459 7.62868L8.2524 15.4222C7.47135 16.2033 6.20502 16.2033 5.42397 15.4222C4.64292 14.6412 4.64292 13.3749 5.42397 12.5938L12.618 5.39976"
            :stroke="color" stroke-width="1.5" stroke-linecap="round" />
    </svg>
</template>

<script>
export default {
    props: {
        color: {
            type: String,
            default: '#fff',
        },
    },
};
</script>