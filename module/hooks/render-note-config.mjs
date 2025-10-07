/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  const hideBackground = application.document.getFlag('Pendragon', 'hide-background') ?? false
  // TODO Remove with v12 support
  const html = (typeof element.querySelector === 'undefined' ? element[0] : element)
  const formGroup = html.querySelector('[name=texture\\.tint]').closest('div.form-group')
  const newGroup = document.createElement('div')
  newGroup.classList.add('form-group')
  formGroup.after(newGroup)
  const label = document.createElement('label')
  label.setAttribute('for', application.id + '-hide-background')
  label.innerText = game.i18n.localize('PEN.mapNoteNoBackground')
  const div = document.createElement('div')
  div.classList.add('form-fields')
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.name = 'flags.Pendragon.hide-background'
  input.checked = hideBackground
  input.id = application.id + '-hide-background'
  div.append(input)
  newGroup.append(label)
  newGroup.append(div)
  formGroup.after(newGroup)
  application.document?.object?.draw()
}