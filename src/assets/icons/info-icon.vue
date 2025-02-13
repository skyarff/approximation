<template>
	<svg class="custom-icon" width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path class="part1" d="M9.49992 17.9166C13.8722 17.9166 17.4166 14.3722 17.4166 9.99992C17.4166 5.62766 13.8722 2.08325 9.49992 2.08325C5.12766 2.08325 1.58325 5.62766 1.58325 9.99992C1.58325 14.3722 5.12766 17.9166 9.49992 17.9166Z" stroke-width="1.5"/>
		<path class="part2" d="M9.5 13.9583V9.20825" stroke-width="1.5" stroke-linecap="round"/>
		<path class="part3" d="M9.49992 6.04167C9.93714 6.04167 10.2916 6.39611 10.2916 6.83333C10.2916 7.27056 9.93714 7.625 9.49992 7.625C9.06269 7.625 8.70825 7.27056 8.70825 6.83333C8.70825 6.39611 9.06269 6.04167 9.49992 6.04167Z" />
	</svg>
</template>

<script>
export default {
	name: 'cog-outline',
	props: {
		color: {
			type: String,
			default: '#fff',
		},
	},
};
</script>

<style scoped>
.part1 {
	stroke: v-bind('color');
}
.part2 {
	stroke: v-bind('color');
}
.part3 {
	fill: v-bind('color');
}
</style>
