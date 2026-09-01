---
title: Two halves make a hole
subtitle: When availability features compose in surprising ways
date: 2026-09-01
description: Two settings, each designed to keep us running, multiplied into the thing that took us down
---

Our job queue metrics flatlined about five minutes after a routine deploy. Not degraded,
not lagging - zero. And when we went to look at why, we couldn't reach the boxes at all.
They had ground to a halt, which meant we didn't even have the wherewithal to roll
anything back.

The suspect list was short and unpromising. Only two things had landed all day: a
test-only PR, and a small helper of mine on Laravel's Eloquent ORM^[I wanted to call
something on the Builder for a many-to-many relation and get back the actual pivot table.
I did it the Laravel Way:tm: - a service provider registering a "macro", which is not a
macro, it just mixes methods into a base class]. I had hooked the helper into the one code
path that needed it, it had test coverage, and it was green. And in the window before the
metrics died, the requests that actually hit my new code were not blowing up in any
noticeable way.

So we split the work: get the site back, and figure out what in the heck just happened.

Recovery came out of a lucky bit of timing. The boxes couldn't even respond over SSH, so
we hard rebooted from the AWS console. They came up, and started picking up jobs. Until
five minutes or so in, when they would flatline again. The same five minutes we had
from the first deploy. I filed that away and got back to work.

It turns out that five minutes is plenty of time. We kept hard rebooting them and used the
window on each to revert my PR. The fleet came back (barring one box we accidentally nuked
- more on that later).

I asked that we leave one box broken. We had a fix, but we had no mechanism, and a
reverted deploy with no explanation is just an outage you've agreed to have again later.
The reproduction was sitting right there, and it was going to be much cheaper to keep it
than to recreate it.

## The first half

The broken box... didn't have much to say. It was set up via Laravel Forge to run
Horizon^[[Laravel Horizon](https://laravel.com/docs/horizon), which manages a set of named
queues declaratively and supervises the worker processes that drain them]. Horizon itself
didn't have any useful logs, but supervisord (which ran the Horizon process) did. Those
logs showed the Horizon supervisor process starting up roughly every fifteen seconds.

If Horizon was starting, something must have been stopping it. So I began my search for
who was killing Horizon. Because the box was under load, I suspected the OOM killer was at
it again. But there was nothing in the kernel logs. There was nothing in the application
logs. No signal, no kill, no clue.

Which meant nobody killed Horizon. It just quit. After some research^[and an actual break
to clear my head], the suspect list was down to one setting: `memory_limit`. If the
Horizon supervisor's resident memory goes over the configured number, it exits. It relies
on supervisord or whatever to start it again on exit.

This exists because of a contract PHP inherited from CGI^[the 90s web thing, not the 90s
movie thing]. PHP was designed to be a very
fast single-shot binary - a request comes in, a script runs, the process dies and takes
every mistake it made with it. That's a genuinely nice property, and an entire ecosystem
of libraries was written against it, which means an entire ecosystem of libraries was
written with no particular reason to care what happens on the four-thousandth iteration of
a loop. Run that code in a persistent process and it leaks. So the ecosystem's answer is
to stop pretending otherwise and just bound the damage: after a while, restart the darn
thing. PHP-FPM has `pm.max_requests` for the same reason. Horizon's flavor is
`memory_limit`.

Except we didn't have a leak. My service provider got loaded at boot,
allocated its footprint once, and sat there. What it did was raise the supervisor's
*baseline*^[give or take a little, depending on how opcache felt that morning - we'll get
back to that in a moment] just past
the line. Boom, crashloop^[The more fun version of this is CrashLoopBackOff from k8s, but
that was not the stack that day].

That explains the churn. It does not explain how the churn crushed a box, since a
supervisor that starts and immediately exits should be about the cheapest thing on the
machine.

## The second half

The other piece of the puzzle is a setting called `fast_termination`. It decides what
happens to the workers when the supervisor shuts down.

Horizon's workers aren't threads and they aren't forks - the supervisor shells out and
spawns them as separate processes, outside its own process space^[PHP can fork, `pcntl` is
right there. Horizon just doesn't; separate long-lived commands are easier to supervise,
restart and reason about than forked children]. So a supervisor on its way out has two
options: wait for its children to finish their current jobs and then exit, or leave
without them.

`fast_termination` picks the second one. The point is deploys: a new supervisor can start
taking jobs immediately instead of waiting on the old generation to drain, so a push is
close to instantaneously running new code^[barring the usual race during the upgrade where
autoload is being churned underneath you, but that's for another day].

The workers that get left behind shift into shut-down mode. They stop accepting new jobs,
and keep running until all in-flight jobs finish. The next supervisor to spin up ignores
these workers and continues with the new code as if nothing happened.

Usually, this is also harmless. The cost is that at any given time you may be
running different versions of the same job, but that's a standard thing that happens any
time you have more than one server of anything. The tail is mostly bounded and recovers by
itself. It's a small price to pay once per deploy, which is why we had it set to true.

## The hole

Put the halves together and you start paying that price frequently, with interest.

The supervisor starts. It spawns a full generation of workers. The memory check happens at
the end of a tick of the supervision loop; it notices it's over `memory_limit`, and leaves
without them. The process manager^[Technically a process manager manager manager -
the master spawns a supervisor per queue, and those spawn the workers. It's shelling all
the way down] starts a fresh
supervisor, which spawns a full generation of workers, notices it's over `memory_limit`,
and leaves without them. Every fifteen seconds, on the clock.

Whether that costs you anything depends entirely on how long your jobs run. Most of our
queues were short, so those workers drained and exited about as fast as they appeared,
and the population stayed flat. But we had queues with jobs that ran up to fifteen minutes
- those decidedly did NOT keep the population flat.

"Zombie processes" has a very particular meaning in Unix-land; unreaped
children^[Unix-land is a very dark place] sitting around doing nothing. This was a very
different type of zombie; the type that liked CPU instead of brains.

These zombies stuck around for up to sixty generations. Load inched up, then climbed as
CPU was completely maxed out, then took the box with it - and each generation was spawned
by a supervisor doing exactly what it said on the tin.

My code, in all this mess, was called on one path, and it broke queues it
never touched, in a process it had no reason to be in. It didn't have to run. It only had
to be loaded.

And, as it turned out, my code didn't even have to be there. After we rebuilt the box we
had nuked, we got a surprise. It came up crashlooping even after the revert - its memory
usage was somewhat different because of some weird interaction with opcache, and it made
it above the threshold without any help.

## The fix

So it was settled - raise `memory_limit` so the supervisor could
actually complete a tick. The fix for the specific issue took about a minute. But this fix
was no better than the revert - still just kicking the can down the road until it happens
again.

In order to keep things safe in the future, I implemented two mitigations. First, I set up
a CI check that simply boots up the app and measures peak memory usage; that gives us an
approximation for what baseline could look like. If it gets close to `memory_limit` then
it fails, and the code can't go live until the imbalance is fixed. Either raise the limit
again, or the app needs a diet^[One of those is simpler, until they come out with Ozempic
for code].

Prevention is one half of the solution, but we were still blind on monitoring. I set up
Horizon to log ERROR when it quits on exceeding `memory_limit`, and set up an extremely
loud alert if that happens twice in a short timespan. This would help in the event that
environmental drift leads to differences in memory usage, like what happened with the
rebuilt box.

We never unreverted the PR. It just sits there, cursed. It never really did anything
wrong. Quite like our settings - they were both simple and well priced. The issue was the
composition, and composition isn't just the space between parts. It's a first-class thing,
with its own behavior and its own price. We never named it, and you can't tell an
anonymous part from a hole. Until you fall in, of course.

The macro, for what it's worth, worked great.
