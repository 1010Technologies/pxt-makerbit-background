//% color=#0fbc11 icon="\u272a" block="MakerBit"
//% category="MakerBit"
namespace makerbit {
    export namespace background {

        export enum Thread {
            Priority = 0,
            UserCallback = 1,
        }

        export enum Mode {
            Repeat,
            Once,
        }

        class Executor {
            _newJobs: Job[] = undefined;
            _jobsToCancel: number[] = undefined;
            _pause: number = 1000;

            constructor(type: Thread) {
                this._newJobs = [];
                this._jobsToCancel = [];
                control.runInParallel(() => this.loop());
            }

            push(task: () => void, delay: number, mode: Mode): number {
                const job = new Job(task, delay, mode);
                this._newJobs.push(job);
                if (delay > 0 && delay < this._pause) {
                    this._pause = Math.floor(delay);
                }
                return job.id;
            }

            cancel(jobId: number) {
                this._jobsToCancel.push(jobId);
            }

            loop(): void {
                const _jobs: Job[] = [];

                let previous = control.millis();

                while (true) {
                    const now = control.millis();
                    const delta = now - previous;
                    previous = now;

                    // Add new jobs
                    this._newJobs.forEach(function (job: Job, index: number) {
                        _jobs.push(job);
                    });
                    this._newJobs = [];

                    // Cancel jobs
                    this._jobsToCancel.forEach(function (jobId: number, index: number) {
                        for (let i = _jobs.length - 1; i >= 0; i--) {
                            const job = _jobs[i];
                            if (job.id == jobId) {
                                _jobs.removeAt(i);
                                break;
                            }
                        }
                    });

                    // Execute all jobs, newest first
                    for (let i = _jobs.length - 1; i >= 0; i--) {
                        if (_jobs[i].run(delta)) {
                            _jobs.removeAt(i);
                        }
                    }

                    basic.pause(this._pause);
                }
            }
        }

        class Job {
            id: number;
            func: () => void;
            delay: number;
            remaining: number;
            mode: Mode;

            constructor(func: () => void, delay: number, mode: Mode) {
                this.id = randint(0, 2147483647)
                this.func = func;
                this.delay = delay;
                this.remaining = delay;
                this.mode = mode;
            }

            run(delta: number): boolean {
                this.remaining -= delta;
                if (this.remaining > 0) {
                    return false;
                }

                switch (this.mode) {
                    case Mode.Once:
                        if (this.delay >= 0) this.func();
                        basic.pause(0);
                        return true;
                    case Mode.Repeat:
                        if (this.delay >= 0) {
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

        const queues: Executor[] = [];

        export function schedule(
            func: () => void,
            type: Thread,
            mode: Mode,
            delay: number,
        ): number {
            if (!func || delay < 0) return 0;

            if (!queues[type]) {
                queues[type] = new Executor(type);
            }

            return queues[type].push(func, delay, mode);
        }

        export function remove(type: Thread, jobId: number): void {
            if (queues[type]) {
                queues[type].cancel(jobId);
            }
        }
    }
}
