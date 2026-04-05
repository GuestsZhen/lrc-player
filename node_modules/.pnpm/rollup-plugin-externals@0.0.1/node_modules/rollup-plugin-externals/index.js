/**
 * @param {Record<string,string>} input
 * @return {import('rollup').Plugin}
 */
export default function externals(input) {
	const record = new Map(Object.entries(input));

	return {
		name: "rollup-plugin-externals",
		// workaround for Vite
		enforce: "pre",
		apply: "build",

		resolveId(id) {
			if (record.has(id)) {
				return { id: "\0" + id, syntheticNamedExports: "default" };
			}
			return null;
		},
		load(id) {
			if (id[0] === "\0") {
				const expr = record.get(id.slice(1));
				if (expr !== undefined) {
					return `export default ${expr}`;
				}
			}
		},
	};
}

export { externals };
