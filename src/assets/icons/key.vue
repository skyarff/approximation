<template>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.66895 10.6636L4.00254 11.9972" :stroke="color" stroke-width="1.5" stroke-miterlimit="10"
            stroke-linecap="round" stroke-linejoin="round" />
        <path d="M4.33594 8.99658L5.66953 10.3302" :stroke="color" stroke-width="1.5" stroke-miterlimit="10"
            stroke-linecap="round" stroke-linejoin="round" />
        <path
            d="M13.5308 9.61668C12.1572 10.9836 10.1902 11.4037 8.46318 10.8636L4.65577 14.6643C4.42906 14.8977 3.98231 15.0377 3.66224 14.9911L2.20863 14.791C1.72853 14.7243 1.28178 14.2709 1.20843 13.7908L1.00839 12.3372C0.961718 12.0171 1.11508 11.5704 1.33512 11.3437L5.13586 7.54294C4.60243 5.80927 5.01584 3.84222 6.38944 2.47529C8.35649 0.508237 11.5504 0.508238 13.5242 2.47529C15.4979 4.44234 15.4979 7.64963 13.5308 9.61668Z"
            :stroke="color" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
        <path
            d="M10.0035 7.32954C10.74 7.32954 11.3371 6.73247 11.3371 5.99595C11.3371 5.25942 10.74 4.66235 10.0035 4.66235C9.26699 4.66235 8.66992 5.25942 8.66992 5.99595C8.66992 6.73247 9.26699 7.32954 10.0035 7.32954Z"
            :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
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