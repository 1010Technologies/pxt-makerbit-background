makerbit.background.schedule(() => {
    basic.showNumber(1)
}, 5000, makerbit.background.Mode.Repeat);

makerbit.background.schedule(() => {
    basic.showNumber(2)
}, 1000, makerbit.background.Mode.Once);

const cancelId = makerbit.background.schedule(() => {
    basic.showNumber(3)
}, 10000, makerbit.background.Mode.Repeat);

makerbit.background.remove(cancelId);

