Promise.delay = ms => new Promise(function(resolve) {
  setTimeout(() => resolve(), ms)
})

// try a function until it does not throw anymore
// useful for wrapping assertions against a black box like DOM rendered output
window.retry = function(fn) {
  var attempts = 0
  return new Promise(function(resolve, reject) {
    var attempt = function() {
      attempts++
      try {
        fn()
        resolve()
      } catch(e) {
        if (attempts < window.retry.maxAttempts) {
          setTimeout(attempt, window.retry.pollInterval)
        } else {
          reject(e)
        }
      }
    }
    setTimeout(attempt, 10)
  })
}
window.retry.maxAttempts = 100
window.retry.pollInterval = 10

// poll a function until it gives a truthy value.
// resolves with the value or rejects with a timeout error,
// or any exception thrown
window.waitUntil = function(predicate, message) {
  var attempts = 0
  return new Promise(function(resolve, reject) {
    var check = function() {
      attempts++
      try {
        var retVal = predicate()
        if (retVal) {
          resolve(retVal)
        } else if (attempts < window.retry.maxAttempts) {
          setTimeout(check, window.waitUntil.pollInterval)
        } else {
          reject(new Error(message || ('timed out: ' + predicate.toString())))
        }
      } catch(e) {
        reject(e)
      }
    }
    check()
  })
}
window.waitUntil.maxAttempts = 100
window.waitUntil.pollInterval = 10

HTMLElement.prototype.waitUntilExists = function(selector) {
  return waitUntil(() => this.querySelector(selector), `"${selector}" did not appear`)
}

HTMLElement.prototype.waitUntilChildContainsText = function(selector, text) {
  return waitUntil(() => {
    var child = this.querySelector(selector)
    return child && child.textContent && child.textContent.indexOf(text) >= 0 && child
  })
}

HTMLElement.prototype.textNodes = function(selector) {
  return Array.from(this.querySelectorAll(selector || '*')).map(n => n.textContent.trim())
}

HTMLElement.prototype.attrValues = function(selector, attr) {
  if (arguments.length === 1) {
    attr = selector
    selector = '*'
  }
  return Array.from(this.querySelectorAll(selector)).map(n => n.getAttribute(attr))
}

HTMLElement.prototype.styleValues = function(selector, style) {
  if (arguments.length === 1) {
    style = selector
    selector = '*'
  }
  return Array.from(this.querySelectorAll(selector)).map(n => n.style[style])
}

// Utility to find adjacent / sibling elements anchored from a parent. Example:
// <dl><div class="highlighted"><dd class="name">Name</dd><dt>Jane</dt></div><div class="highighted"><dd class="var">foo</dd><dt>bar</dt></div></dl>
// dl.findAdjacent('.highlighted', 'dd.name', 'dt') => [<dt>Jane</dt>]
HTMLElement.prototype.findAdjacent = function(parent, matchChild, targetChild) {
  return Array.prototype.filter.call(
    this.querySelectorAll(parent),
    el => !!el.querySelector(matchChild)
  ).map(el => targetChild ? el.querySelector(targetChild) : el)
}

// Utility to find adjacent / sibling text of elements anchored from a parent. Example:
// <dl><div class="kvp"><dd>Name</dd><dt><a href="">Jane</a></dt><dd>Name</dd><dt>Bob</dt></div></dl>
// dl.findAdjacentText('.kvp', 'dd a', 'dt') => ["Jane"]
HTMLElement.prototype.findAdjacentText = function() {
  return this.findAdjacent.apply(this, arguments).map(n => n.textContent.trim())
}

HTMLElement.prototype.trigger = function(eventName, eventClass, extra) {
  if (eventClass && typeof eventClass === 'object') {
    extra = eventClass
    eventClass = null
  }
  if (!eventClass) {
    eventClass = eventName === 'click' || eventName.indexOf('mouse') !== -1 ? 'MouseEvents' : 'Events'
  }

  var evt = document.createEvent(eventClass)
  evt.initEvent(eventName, true, true)
  if (extra) {
    Object.assign(evt, extra)
  }
  this.dispatchEvent(evt)
  return this
}

chai.Assertion.addProperty('selected', function() {
  var friendlyDesc = chai.util.elToString(this._obj)
  this.assert(
    this._obj.getAttribute('aria-selected') === 'true',
    `expected ${friendlyDesc} to be selected`,
    `expected ${friendlyDesc} to not be selected`
  )
})

chai.Assertion.addProperty('enabled', function() {
  var friendlyDesc = chai.util.elToString(this._obj)
  this.assert(
    this._obj.getAttribute('aria-disabled') !== 'true',
    `expected ${friendlyDesc} to be enabled`,
    `expected ${friendlyDesc} to not be enabled`
  )
})

chai.Assertion.addProperty('disabled', function() {
  var friendlyDesc = chai.util.elToString(this._obj)
  this.assert(
    this._obj.getAttribute('aria-disabled') === 'true',
    `expected ${friendlyDesc} to be disabled`,
    `expected ${friendlyDesc} to not be disabled`
  )
})