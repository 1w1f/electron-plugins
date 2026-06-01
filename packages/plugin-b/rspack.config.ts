import { defineConfig } from '@rspack/cli'
import { rspack } from '@rspack/core'
import RefreshPlugin from '@rspack/plugin-react-refresh'
import { builtinModules } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'
const outDir = resolve(__dirname, '../../plugin-dev-output/plugin-b')

export default defineConfig([
  {
    name: 'frontend',
    target: 'web',
    entry: {
      main: resolve(__dirname, 'src/main.tsx')
    },
    output: {
      path: resolve(outDir, 'assets'),
      filename: 'main.[contenthash:8].js',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    plugins: [
      new rspack.HtmlRspackPlugin({
        template: resolve(__dirname, 'index.html'),
        filename: resolve(outDir, 'index.html')
      }),
      isDev && new RefreshPlugin()
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'typescript', tsx: true },
                transform: {
                  react: { runtime: 'automatic' }
                }
              }
            }
          },
          exclude: /node_modules/
        }
      ]
    },
    devServer: {
      port: 5174,
      hot: true
    }
  },
  {
    name: 'backend',
    target: 'node',
    entry: {
      backend: resolve(__dirname, 'src/backend.ts')
    },
    output: {
      path: outDir,
      filename: '[name].js',
      library: { type: 'commonjs2' }
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    externals: {
      electron: 'commonjs electron',
      ...builtinModules.reduce((acc, mod) => ({ ...acc, [mod]: `commonjs ${mod}` }), {})
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: { loader: 'builtin:swc-loader' },
          exclude: /node_modules/
        }
      ]
    }
  }
])
