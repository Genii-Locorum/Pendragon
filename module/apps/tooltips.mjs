export class PENTooltips {
    constructor () {
      this.ToolTipHover = null
      this.toolTipTimer = null
    }
  
    displayToolTip (toolTip) {
      if (typeof this.ToolTipHover !== 'undefined') {
        const bounds = this.ToolTipHover.getBoundingClientRect()
        if (!isNaN(bounds.left || '') && !isNaN(bounds.top || '')) {
          let left = bounds.left
          let top = bounds.top
          const heightText = $(this.ToolTipHover).outerHeight()
          $('body').append('<div id="help-tooltip">' + toolTip + '</div>')
          const tip = $('#help-tooltip')
          const heightTip = tip.outerHeight()
          const widthTip = tip.outerWidth()
          if (window.innerHeight < heightText * 1.5 + heightTip + top) {
            top = top - heightTip
          } else {
            top = top + heightText * 1.5
          }
          if (window.innerWidth < widthTip + left) {
            left = window.innerWidth - widthTip
          }
          tip.css({
            left: left + 'px',
            top: top + 'px'
          })
        }
      }
    }
  
    toolTipLeave (event) {
      if (game.PENTooltips.ToolTipHover === event.currentTarget) {
        clearTimeout(game.PENTooltips.toolTipTimer)
        game.PENTooltips.ToolTipHover = null
        $('#help-tooltip').remove()
      }
    }
  }