namespace makerbit {
    export namespace background {
        export enum Mode {
            Repeat,
            Once,
        }

        let _newJobs: Job[] = undefined;
        let _jobsToCancel: number[] = undefined;
        let _pause: number = 100;
        let _maxJobId = -1;

        function loop() {
            const _jobs: Job[] = [];

            let previous = control.millis();

            while (true) {
                const now = control.millis();
                const delta = now - previous;
                previous = now;

                // Add new jobs
                _newJobs.forEach(function (job: Job, index: number) {
                    _jobs.push(job);
                });
                _newJobs = [];

                // Cancel jobs
                _jobsToCancel.forEach(function (jobId: number, index: number) {
                    for (let i = 0; i < _jobs.length; ++i) {
                        const job = _jobs[i];
                        if (job.id == jobId) {
                            _jobs.removeAt(i);
                            break;
                        }
                    }
                });

                // Get maximum job Id
                _maxJobId = _jobs.length == 0 ? 0 : _jobs[_jobs.length - 1].id;

                // Execute newest jobs first
                for (let i = _jobs.length - 1; i >= 0; i--) {
                    if (_jobs[i].run(delta)) {
                        _jobs.removeAt(i);
                    }
                }

                basic.pause(_pause);
            }
        }

        class Job {
            id: number;
            func: () => void;
            delay: number;
            remaining: number;
            mode: Mode;

            constructor(func: () => void, delay: number, mode: Mode) {
                this.id = ++_maxJobId;
                this.func = func;
                this.delay = delay;
                this.remaining = delay;
                this.mode = mode;

                if (delay > 0 && delay < _pause) {
                    _pause = Math.floor(delay);
                }
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

        export function schedule(
            func: () => void,
            delay: number,
            mode: Mode
        ): number {
            if (!func || delay < 0) return 0;
            if (_maxJobId == -1) {
                _maxJobId = 0;
                _newJobs = [];
                _jobsToCancel = [];
                control.runInParallel(loop);
            }
            const job = new Job(func, delay, mode);
            _newJobs.push(job);
            return job.id;
        }

        export function remove(jobId: number): void {
            if (_maxJobId == -1) return;
            _jobsToCancel.push(jobId);
        }
    }
}
