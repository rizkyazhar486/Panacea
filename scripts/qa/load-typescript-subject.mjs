import { build } from 'esbuild'

// Bundle pure test subjects with the existing compiler; plain node --test must
// not depend on native TypeScript support newer than the declared Node engine.
export async function loadTypeScriptSubject(entry) {
  const { outputFiles } = await build({ entryPoints: [entry], bundle: true, write: false,
    format: 'esm', platform: 'node', target: 'node20.19' })
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
}
