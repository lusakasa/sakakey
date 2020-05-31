import { copy } from 'lib/dom'
import { background } from 'lib/msg'

export const copyURL = () => {
  copy(document.location.href)
}

export const copyToORG = () => {
  function elideTitle () {
    if (document.title.length > 80) {
      return document.title.substr(0, 80 - 3).concat('...')
    } else {
      return document.title
    }
  }
  copy('[[' + document.location.href + '][' + elideTitle() + ']]')
}

export const clipboardCurrentTab = background('clipboardCurrentTab')
export const clipboardBackgroundTab = background('clipboardBackgroundTab')
export const clipboardForegroundTab = background('clipboardForegroundTab')
export const clipboardNewWindow = background('clipboardNewWindow')
export const clipboardIncognitoWindow = background('clipboardIncognitoWindow')
