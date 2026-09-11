import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = ts.transpileModule(readFileSync(new URL('../src/projects.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const { LocalStorageProjectApi, STORAGE_KEY } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
function setup() {
  const data = new Map()
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  return { api: new LocalStorageProjectApi(() => storage), storage, data }
}
test('CRUD persists across API instances and preserves stable IDs', async () => {
  const { api, storage } = setup()
  assert.deepEqual(await api.list(), [])
  const project = await api.create({ nazwa: ' Projekt ', opis: ' Opis ' })
  assert.equal(project.nazwa, 'Projekt')
  const fresh = new LocalStorageProjectApi(() => storage)
  assert.deepEqual(await fresh.get(project.id), project)
  const edited = await fresh.update(project.id, { nazwa: 'Zmieniony', opis: '' })
  assert.equal(edited.id, project.id)
  assert.equal((await api.get(project.id)).nazwa, 'Zmieniony')
  await fresh.delete(project.id)
  assert.deepEqual(await api.list(), [])
})
test('invalid input and missing IDs do not modify stored data', async () => {
  const { api } = setup()
  await assert.rejects(api.create({ nazwa: '  ', opis: '' }))
  await assert.rejects(api.create({ nazwa: 'a'.repeat(101), opis: '' }))
  await assert.rejects(api.create({ nazwa: 'OK', opis: 'a'.repeat(2001) }))
  await assert.rejects(api.update('missing', { nazwa: 'OK', opis: '' }))
  await assert.rejects(api.delete('missing'))
  assert.deepEqual(await api.list(), [])
})
test('corrupted data is reported and never overwritten', async () => {
  const { api, data } = setup()
  for (const raw of ['{invalid', '{}', '[{"id":1}]']) {
    data.set(STORAGE_KEY, raw)
    await assert.rejects(api.list(), /uszkodzone/)
    await assert.rejects(api.create({ nazwa: 'OK', opis: '' }), /uszkodzone/)
    assert.equal(data.get(STORAGE_KEY), raw)
  }
})
test('storage access and quota failures are reported', async () => {
  const blocked = new LocalStorageProjectApi(() => { throw new Error('blocked') })
  await assert.rejects(blocked.list(), /Brak dostępu/)
  const full = new LocalStorageProjectApi(() => ({ getItem: () => null, setItem: () => { throw new Error('quota') } }))
  await assert.rejects(full.create({ nazwa: 'OK', opis: '' }), /Nie udało się zapisać/)
})
