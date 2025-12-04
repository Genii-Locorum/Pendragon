/* global $ */
export default function (application, html, data) {
  if ((application.document.parent.getFlag('Pendragon', 'css-adventure-entry') ?? false)) {
    if (!html.classList.contains('pen-adventure-entry')) {
      html.classList.add('pen-adventure-entry')
    }
    const toggles = html.querySelectorAll('section.tmi-toggleable p.toggle')
    for (const toggle of toggles) {
      toggle.onclick = (event) => {
        const obj = $(event.currentTarget)
        const section = obj.closest('section.tmi-toggleable').find('div.toggle:first')
        if (section.is(':visible')) {
          obj.text('Reveal')
          section.slideUp()
        } else {
          obj.text('Hide')
          section.slideDown()
        }
      }
    }
  }
}