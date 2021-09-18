makerbit.background.schedule(
    () => {
        basic.showNumber(1)
    }, makerbit.background.Thread.Priority,
    makerbit.background.Mode.Repeat,
    5000
);

makerbit.background.schedule(
    () => {
        basic.showNumber(2)
    },
    makerbit.background.Thread.Priority,
    makerbit.background.Mode.Once,
    1000
);

const cancelId = makerbit.background.schedule(
    () => {
        basic.showNumber(3)
    },
    makerbit.background.Thread.UserCallback,
    makerbit.background.Mode.Repeat,
    10000
);

makerbit.background.remove(makerbit.background.Thread.UserCallback, cancelId);

