import browser from 'webextension-polyfill'
import { msg, get, meta } from 'mosi/core'
import { generateHintStrings } from './hintStrings'

let hintChars = 'adsfghjkl;'
let autoActivateHint = false

export default {
  onOptionsChange: options => {
    hintChars = options.hintChars.length >= 2 ? options.hintChars : 'bad'
    autoActivateHint = options.autoActivateHint
  },
  messages: {
    findHints: async (config, src) => {
      // Gather the number of hintable elements in each frame
      const currentTabTarget = `tab[${meta(src).tabId}]|id[${src}]`
      const hintsPerFrame = await get(currentTabTarget, 'findHints', config)
      const totalHints = hintsPerFrame.reduce((total, { v }) => total + v, 0)
      // If no hints, immediately exit Hints mode
      if (totalHints === 0) {
        msg(currentTabTarget, 'exitHintsMode')
        // If exactly one hint, immediately activate it (if autoactivation enabled by user)
      } else if (totalHints === 1 && autoActivateHint) {
        const { id } = hintsPerFrame.find(({ v, id }) => v === 1)
        const [{ v: nextMode }] = await get(id, 'activateFirstHint')
        msg(currentTabTarget, 'exitHintsMode', nextMode)
        // If multiple hints, trigger hint rendering
      } else {
        const uniqueChars = String.prototype.concat(...new Set(hintChars))
        const hintStrings = generateHintStrings(uniqueChars, totalHints)
        let offset = 0
        hintsPerFrame.forEach(({ id, v }) => {
          const nextOffset = offset + v
          msg(id, 'renderHints', hintStrings.slice(offset, nextOffset))
          offset = nextOffset
        })
      }
    },
    processKey: async (event, src) => {
      const currentTabTarget = `tab[${meta(src).tabId}]|id[${src}]`
      try {
        const results = await get(currentTabTarget, 'advanceHints', event)
        if (results.every(({ v }) => v === 'Filtered')) {
          msg(currentTabTarget, 'exitHintsMode')
          return
        }
        const nextMode = results.find(
          ({ v }) => v !== 'Same' && v !== 'Filtered' && v !== undefined
        )
        if (nextMode) {
          msg(currentTabTarget, 'exitHintsMode', nextMode.v)
        }
      } catch (e) {}
    },
    openLinkInIncognitoWindow: url => {
      // TODO: consider more robust URL verification like Vimium's
      browser.windows.create({ url, incognito: true })
    },
    // Needed to activate links on firefox because it ignores keyboard modifiers
    // or doesn't execute default behaviors on click events
    ...(SAKA_PLATFORM === 'chrome'
      ? {}
      : {
        openLinkInBackgroundTab: url => {
          const arg = {
            url: url,
            active: false
          }
          browser.tabs
            .query({ currentWindow: true, active: true })
            .then(t => {
              arg.cookieStoreId = t[0].cookieStoreId
            })
            .finally(() => {
              browser.tabs.create(arg)
            })
        },
        openLinkInForegroundTab: url => {
          const arg = {
            url: url,
            active: true
          }
          browser.tabs
            .query({ currentWindow: true, active: true })
            .then(t => {
              arg.cookieStoreId = t[0].cookieStoreId
            })
            .finally(() => {
              browser.tabs.create(arg)
            })
        },
        openLinkInNewWindow: url => {
          const arg = {
            url: url
          }
          browser.tabs
            .query({ currentWindow: true, active: true })
            .then(t => {
              arg.cookieStoreId = t[0].cookieStoreId
            })
            .finally(() => {
              browser.windows.create(arg)
            })
        }
      })
  }
}
