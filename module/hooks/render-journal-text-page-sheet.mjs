/* global $ */
export default function (application, html, data) {
  if ((application.object.parent.getFlag('Pendragon', 'css-adventure-entry') ?? false)) {
    if (!html.hasClass('pen-adventure-entry')) {
      html.addClass('pen-adventure-entry')
      html.find('section.tmi-toggleable p.toggle').click((event) => {
        const obj = $(event.currentTarget)
        const section = obj.closest('section.tmi-toggleable').find('div.toggle:first')
        if (section.is(':visible')) {
          obj.text('Reveal')
          section.slideUp()
        } else {
          obj.text('Hide')
          section.slideDown()
        }
      })
    }
  }
}