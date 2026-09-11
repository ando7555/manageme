import './style.css'
import { LocalStorageProjectApi, type Project } from './projects'
const api = new LocalStorageProjectApi()
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header><a href="./" class="brand"><b>M</b> ManageMe <small>STARTER</small></a><span>Moja przestrzeń</span></header>
<main><section class="intro"><div><p class="eyebrow">PRZESTRZEŃ NA TWOJE POMYSŁY</p><h1>Twoje projekty.<br><em>W jednym miejscu.</em></h1><p>Od pierwszego pomysłu do kolejnego kroku.<br>Stwórz projekt i uporządkuj to, nad czym pracujesz.</p></div><div class="summary"><strong id="count">0</strong><p>projektów w Twojej przestrzeni</p></div></section>
<div class="layout"><section><div class="heading"><h2>Moje projekty</h2><span>● Zapis lokalny</span></div><label class="sr-only" for="search">Szukaj projektu</label><input id="search" type="search" placeholder="Szukaj po nazwie lub opisie…"><div id="list" aria-live="polite"></div></section>
<aside><p class="eyebrow">ZACZNIJ TUTAJ</p><h2 id="form-title">Nowy projekt</h2><p class="muted">Dobry pomysł zasługuje na własne miejsce.</p><form id="form"><label for="name">Nazwa projektu *</label><input id="name" required maxlength="100" placeholder="np. Moja pierwsza aplikacja"><label for="description">Opis</label><textarea id="description" rows="5" maxlength="2000" placeholder="Co chcesz zrealizować?"></textarea><p class="hint">Krótki opis pomoże Ci wrócić do pomysłu.</p><button class="primary" id="submit">+ Utwórz projekt</button><button id="cancel" type="button" hidden>Anuluj edycję</button></form><p class="note">Twoje projekty są zapisywane w tej przeglądarce.</p></aside></div>
<p id="status" role="status"></p><footer>ManageMe <span>Małe kroki. Wielkie projekty.</span></footer></main>
<dialog id="dialog"><h2>Usunąć projekt?</h2><p id="delete-message"></p><p>Tej operacji nie można cofnąć.</p><div class="dialog-actions"><button id="keep">Zachowaj projekt</button><button id="delete" class="danger">Usuń projekt</button></div></dialog>`
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const form = el<HTMLFormElement>('form'), name = el<HTMLInputElement>('name'), description = el<HTMLTextAreaElement>('description'), search = el<HTMLInputElement>('search'), dialog = el<HTMLDialogElement>('dialog')
let editingId: string | null = null, deletingId: string | null = null
let projects: Project[] = []
function message(text: string, error = false) { el('status').textContent = text; el('status').classList.toggle('error', error) }
function reset() { editingId = null; form.reset(); el('form-title').textContent = 'Nowy projekt'; el('submit').textContent = '+ Utwórz projekt'; el('cancel').hidden = true }
function render() {
  el('count').textContent = String(projects.length)
  const list = el('list')
  list.replaceChildren()
  const query = search.value.toLocaleLowerCase('pl')
  const visible = projects.filter(p => `${p.nazwa} ${p.opis}`.toLocaleLowerCase('pl').includes(query))
  if (!visible.length) {
    const empty = document.createElement('div')
    empty.className = 'empty'
    empty.innerHTML = projects.length ? '<span>⌕</span><h3>Brak pasujących projektów</h3><p>Spróbuj innej nazwy lub opisu.</p>' : '<span>＋</span><h3>Tu zaczyna się coś dobrego</h3><p>Dodaj swój pierwszy projekt za pomocą formularza.</p>'
    list.append(empty)
  }
  visible.forEach(project => {
    const card = document.createElement('article'); card.className = 'card'
    const icon = document.createElement('div'); icon.className = 'icon'; icon.textContent = project.nazwa.slice(0, 1).toLocaleUpperCase('pl')
    const title = document.createElement('h3'); title.textContent = project.nazwa
    const details = document.createElement('p'); details.className = 'description'; details.textContent = project.opis || 'Ten projekt czeka na opis.'
    const actions = document.createElement('div'); actions.className = 'actions'
    const edit = document.createElement('button'); edit.textContent = 'Edytuj ↗'; edit.setAttribute('aria-label', `Edytuj projekt ${project.nazwa}`)
    edit.onclick = () => { editingId = project.id; name.value = project.nazwa; description.value = project.opis; el('form-title').textContent = 'Edytuj projekt'; el('submit').textContent = 'Zapisz zmiany'; el('cancel').hidden = false; name.focus() }
    const remove = document.createElement('button'); remove.textContent = 'Usuń'; remove.className = 'delete-link'; remove.setAttribute('aria-label', `Usuń projekt ${project.nazwa}`)
    remove.onclick = () => { deletingId = project.id; el('delete-message').textContent = `Projekt „${project.nazwa}” zostanie usunięty.`; dialog.showModal(); el('keep').focus() }
    actions.append(edit, remove); card.append(icon, title, details, actions); list.append(card)
  })
}
async function refresh() { try { projects = await api.list(); render() } catch (error) { message((error as Error).message, true) } }
form.onsubmit = async event => {
  event.preventDefault()
  try {
    const input = { nazwa: name.value, opis: description.value }
    if (editingId) await api.update(editingId, input); else await api.create(input)
    message(editingId ? 'Zmiany zostały zapisane.' : 'Projekt został utworzony.')
    reset(); await refresh()
  } catch (error) { message((error as Error).message, true) }
}
el('cancel').onclick = reset
search.oninput = render
el('keep').onclick = () => dialog.close()
el('delete').onclick = async () => {
  if (!deletingId) return
  try { await api.delete(deletingId); if (editingId === deletingId) reset(); dialog.close(); message('Projekt został usunięty.'); await refresh() }
  catch (error) { dialog.close(); message((error as Error).message, true) }
}
window.addEventListener('storage', () => void refresh())
void refresh()
