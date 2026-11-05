import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import molcssPlugin from "molcss/vite-plugin"
import pagesPlugin from 'vite-plugin-pages'
import child_process from "node:child_process"

function getGitCommitHash() {
  const ls = child_process.spawn('git', ["rev-parse", "--short", "HEAD"]);

  return new Promise<string>((resolve, _reject) => {
    ls.stdout.on('data', (data) => {
      resolve(data)
    })
  })
}

export default defineConfig(async(options) => {
  const currentCommitHash = await getGitCommitHash()
  const version = `1.0.0-${currentCommitHash}`.replace("\n", "")
  return {
    plugins: [
      solidPlugin(),
      molcssPlugin({
        content: 'frontend/**/*.{js,jsx,ts,tsx}',
      }),
      pagesPlugin({
        dirs: ['./frontend/pages'],
      })
    ],
    server: {
      port: 3000,
    },
    build: {
      target: 'esnext',
      sourcemap: options.mode === "prod_debug",
      outDir: "./dist/app"
    },
    esbuild: {
      define: {
        APP_VERSION: `"${version}"`
      }
    }
  }
})
