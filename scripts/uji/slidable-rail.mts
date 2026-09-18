const { edgeState, nextIndex, scrollBehavior, clampScrollTarget } = await import('../../src/lib/interaction/slidable.ts')

const chk = (name: string, condition: boolean, detail = '') => console.log(condition ? 'PASS' : 'FAIL', name, detail)

const start = edgeState(0, 300, 900)
chk('rail start cannot scroll left', start.canLeft === false)
chk('rail start can scroll right', start.canRight === true)

const middle = edgeState(300, 300, 900)
chk('rail middle can scroll left', middle.canLeft === true)
chk('rail middle can scroll right', middle.canRight === true)

const end = edgeState(600, 300, 900)
chk('rail end can scroll left', end.canLeft === true)
chk('rail end cannot scroll right', end.canRight === false)

chk('right keyboard navigation advances one item', nextIndex(1, 4, 'right') === 2)
chk('right keyboard navigation clamps at last item', nextIndex(3, 4, 'right') === 3)
chk('left keyboard navigation clamps at first item', nextIndex(0, 4, 'left') === 0)
chk('empty rail returns no index', nextIndex(0, 0, 'right') === -1)
chk('reduced motion uses immediate reveal', scrollBehavior(true) === 'auto')
chk('normal motion uses smooth reveal', scrollBehavior(false) === 'smooth')
chk('scroll target clamps below zero', clampScrollTarget(-50, 300, 900) === 0)
chk('scroll target clamps above maximum', clampScrollTarget(999, 300, 900) === 600)
