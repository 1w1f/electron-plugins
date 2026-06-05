import { defineConfig } from '@rspack/cli'
import { rspack } from '@rspack/core'
import RefreshPlugin from '@rspack/plugin-react-refresh'
import { builtinModules } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'
const outDir = resolve(__dirname, '../../plugin-dev-output/plugin-a')

export default defineConfig([
  {
    name: 'frontend',
    target: 'web',
    entry: {
      main: resolve(__dirname, 'src/main.tsx')
    },
    output: {
      path: resolve(outDir),
      filename: 'assets/main.[contenthash:8].js',
      clean: false
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    plugins: [
      new rspack.HtmlRspackPlugin({
        template: resolve(__dirname, 'index.html'),
        filename: 'index.html'
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
      port: 5175,
      hot: true,
      setupMiddlewares: (middlewares: any, devServer: any) => {
        devServer.app.get('/__plugin-info', (_req: any, res: any) => {
          const configPath = resolve(__dirname, 'plugin.config.json')
          const backendDir = resolve(__dirname, '../../plugin-dev-output/plugin-a')
          const backendPath = resolve(backendDir, 'backend.js')

          if (!existsSync(configPath)) {
            res.status(500).json({ error: 'plugin.config.json not found' })
            return
          }

          try {
            const config = JSON.parse(readFileSync(configPath, 'utf-8'))
            res.json({
              name: config.name,
              displayName: config.displayName,
              version: config.version,
              window: config.window,
              configPath,
              backendPath: existsSync(backendPath) ? backendPath : null
            })
          } catch (err) {
            res.status(500).json({ error: String(err) })
          }
        })
        return middlewares
      }
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
