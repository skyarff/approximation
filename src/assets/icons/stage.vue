<template>
    <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="1" width="6.00001" height="6" rx="2.5" transform="rotate(90 15 1)" :stroke="color" />
        <rect x="6.5" y="1" width="6.00001" height="6" rx="2.5" transform="rotate(90 6.5 1)" :stroke="color" />
        <rect x="15" y="9" width="6.00001" height="6" rx="2.5" transform="rotate(90 15 9)" :stroke="color" />
        <rect x="6.5" y="9" width="6.00001" height="6" rx="2.5" transform="rotate(90 6.5 9)" :stroke="color" />
        <rect x="15" y="17" width="6.00001" height="6" rx="2.5" transform="rotate(90 15 17)" :stroke="color" />
        <rect x="6.5" y="17" width="6.00001" height="6" rx="2.5" transform="rotate(90 6.5 17)" :stroke="color" />
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