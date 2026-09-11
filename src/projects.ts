export interface Project { id: string; nazwa: string; opis: string }
export type ProjectInput = Omit<Project, 'id'>
export interface ProjectApi {
  list(): Promise<Project[]>
  get(id: string): Promise<Project | undefined>
  create(input: ProjectInput): Promise<Project>
  update(id: string, input: ProjectInput): Promise<Project>
  delete(id: string): Promise<void>
}
export const STORAGE_KEY = 'manageme.projects.v1'
export class LocalStorageProjectApi implements ProjectApi {
  private storage: () => Storage
  constructor(storage: () => Storage = () => window.localStorage) { this.storage = storage }
  private read(): Project[] {
    let raw: string | null
    try { raw = this.storage().getItem(STORAGE_KEY) }
    catch { throw new Error('Brak dostępu do pamięci przeglądarki.') }
    if (raw === null) return []
    try {
      const data: unknown = JSON.parse(raw)
      if (!Array.isArray(data) || !data.every(p => p && typeof p.id === 'string' && typeof p.nazwa === 'string' && typeof p.opis === 'string') || new Set(data.map(p => p.id)).size !== data.length) throw new Error()
      return data as Project[]
    } catch { throw new Error('Zapisane dane są uszkodzone. Nie zostały nadpisane.') }
  }
  private write(projects: Project[]) {
    try { this.storage().setItem(STORAGE_KEY, JSON.stringify(projects)) }
    catch { throw new Error('Nie udało się zapisać zmian. Pamięć jest pełna lub niedostępna.') }
  }
  private validate(input: ProjectInput): ProjectInput {
    const nazwa = input.nazwa.trim(), opis = input.opis.trim()
    if (!nazwa || nazwa.length > 100) throw new Error('Podaj nazwę projektu (od 1 do 100 znaków).')
    if (opis.length > 2000) throw new Error('Opis może mieć maksymalnie 2000 znaków.')
    return { nazwa, opis }
  }
  async list() { return this.read() }
  async get(id: string) { return this.read().find(p => p.id === id) }
  async create(input: ProjectInput) {
    const project = { ...this.validate(input), id: crypto.randomUUID() }
    this.write([...this.read(), project])
    return project
  }
  async update(id: string, input: ProjectInput) {
    const projects = this.read(), index = projects.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Projekt już nie istnieje. Odśwież listę.')
    const project = { ...this.validate(input), id }
    projects[index] = project
    this.write(projects)
    return project
  }
  async delete(id: string) {
    const projects = this.read()
    if (!projects.some(p => p.id === id)) throw new Error('Projekt już nie istnieje. Odśwież listę.')
    this.write(projects.filter(p => p.id !== id))
  }
}
