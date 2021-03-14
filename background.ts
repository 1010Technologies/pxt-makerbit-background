namespace makerbit {

    export namespace background {
        export enum Mode {
            Repeat,
            Once
        }

        let _jobs: Job[] = undefined;

        function loop() {
            let previous = control.millis();
            let _toBeDeleted: Job[] = []

            while (true) {
                const now = control.millis();
                const delta = now - previous;
                previous = now;

                _jobs.forEach(function (interval: Job, index: number) {
                    if (interval.run(delta)) {
                        _toBeDeleted.push(interval);
                    }
                })

                _toBeDeleted.forEach(function (interval: Job, index: number) {
                    _jobs.removeElement(interval);
                })

                basic.pause(15);
            }
        }


        class Job {
            id: number;
            func: () => void;
            delay: number;
            remaining: number;
            mode: Mode;

            constructor(func: () => void, delay: number, mode: Mode) {
                this.id = _jobs.length == 0
                    ? 1 : _jobs[_jobs.length - 1].id + 1;
                this.func = func;
                this.delay = delay;
                this.remaining = delay;
                this.mode = mode;
                _jobs.push(this);
            }

            run(delta: number): boolean {
                this.remaining -= delta;
                if (this.remaining > 0) {
                    return false;
                }

                switch (this.mode) {
                    case Mode.Once:
                        if (this.delay >= 0)
                            this.func();
                        basic.pause(0);
                        return true
                    case Mode.Repeat:
                        if (this.delay > 0) {
                            this.func();
                            this.remaining = this.delay;
                            basic.pause(0);
                            return false;
                        } else {
                            // might have been cancelled during this duration
                            return true;
                        }

                }
            }

            cancel() {
                this.delay = -1;
            }
        }

        export function schedule(func: () => void, delay: number, mode: Mode): number {
            if (!func || delay < 0) return 0;
            if (!_jobs) {
                _jobs = [];
                control.runInParallel(loop);
            }
            const interval = new Job(func, delay, mode);
            return interval.id;
        }

        export function clear(intervalId: number, mode: Mode): void {
            if (!_jobs) return;
            for (let i = 0; i < _jobs.length; ++i) {
                const it = _jobs[i];
                if (it.id == intervalId && it.mode == mode) {
                    it.cancel();
                    break;
                }
            }
        }
    }
}