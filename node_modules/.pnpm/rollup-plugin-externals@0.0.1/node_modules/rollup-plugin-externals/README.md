# rollup-plugin-externals

This is a Rollup plugin that provides functionality similar to webpack's externals.

## Installation

```bash
pnpm i -D rollup-plugin-externals
```

## Configuration

```JavaScript
import { defineConfig } from "rollup";
import { externals } from "rollup-plugin-externals";

export default defineConfig({
    plugins:[
        externals({
            "react": "React",
            "react-dom": "ReactDOM",
        })
    ]
});
```
