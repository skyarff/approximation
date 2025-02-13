<template>
	<svg class="custom-icon" width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path class="part1" d="M2 2L14 14"  stroke-width="2" stroke-linecap="round"/>
		<path class="part2" d="M2 14L14 2" stroke-width="2" stroke-linecap="round"/>
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
</style>
