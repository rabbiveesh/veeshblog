---
title: The sound of silence
subtitle: What breaks when everyone is right
date: 2026-08-18
description: Chasing a blank screen down through docker, Debian and a database client I never even knew I chose
---

One day, my dev environment simply stopped working. I came in with a `docker compose up
-d`{.nowrap} and all I got for it was a blank screen. This was strange - no errors, no logs, no
nothing. Just blank. I couldn't do any work, so I did the only thing reasonable^[aside from [flicking my fingers](https://web.archive.org/web/20230302124347/https://dilbert.com/strip/1994-11-23)]; start debugging.

The first thing I like to do in a debugging process^[well, after getting coffee] is to collect all the strange information I
have. Usually things behave in a way different than I expect because reality mismatches
against my mental model, so the handiest thing to have is a list of surprising
behaviors. They tend to surprise specifically because they don't fit the model.

In this case, a few months before, I had received a report from a member of a different
team who had occasion to work on our repo. She had complained that her stack couldn't
start, and I had sat and tried to debug with her, but I simply couldn't reproduce the
issue locally. It was the same thing that I saw that fateful day - no logs, no content. She finished her PR, I reviewed it, and business went on as usual. 

The only other blip was that some time afterwards, another member of her team ran into the same issue, and again I couldn't reproduce. Same blank screen, same radio silence.

So it was on to collecting more information; once it happened to me I could debug as deep
as I wished. After some careful instrumentation^[reading the init script and adding a log
line when it does something interesting], it turned out that our image's init script was
stuck in a loop waiting for the database to register as live. This may seem extraneous,
because docker compose allows you to define healthchecks which do this for you. However,
everything in software is tradeoffs. Healthchecks gate a service starting at all, in our
case the service was PHP, and we bind mounted vendor instead of baking it into the
image^[More tradeoffs - mainly so PHPStorm can index them], so we had an init step which
would `composer install`^[I happen to think that an even better solution for this is my
[composr](https://github.com/rabbiveesh/composr) running in git hooks, but obviously I'm
biased here].

The only problem? The database WAS ready - I could use the mysql container and query
whatever tables I wanted, and also our app could happily connect if you would run a
command directly instead of our init script. This was progress; instead of something
weird, I had something that contradicted itself.

And so I accepted reality over the comfortable facade of my mental model. In this case, we had a totally reasonable retry loop, expecting
a check to fail until it doesn't. So in the absence of anything else, I made it do the simplest
thing - pick a reasonable time and set that as a timeout. If it times out, something is weird
so print the error. This is something that I'm constantly trying to build into a stronger habit;
write everything assuming it'll be wrong^[yes, I rewrote this paragraph at least once],
failing loudly in the impossible case.

And then, finally, gold. A sweet, sweet error message:
```
ERROR 2026 (HY000): TLS/SSL error: self-signed certificate in certificate chain
```
Would ya look at that. MySQL (the server) very helpfully creates a self-signed certificate for local
development purposes. And apparently, `mysql` (the command line) doesn't like to connect
to self-signed certificates while demanding TLS. Further progress - I had a clear cause,
the only thing missing was the explanation.

You see, mysql isn't our app; nobody made any changes there. Not
to the docker compose service, not to our docker image. We were using the stock
php-8.4.x-fpm
images from docker hub. The only interesting thing that I could think of is we bumped it a minor
version. But that doesn't explain why the exact same breakage was happening to people not
on the team several months earlier. Every line of code then was exactly the same. Insanity.

And so, after some furious google and stack overflow-ing^[is that even a word?], I discovered the true root cause. Debian Trixie had been released. As a result,
all of the php docker images were bumped to be based on Trixie rather than Bookworm. To
avoid tag proliferation, they bumped all non-`bookworm` tagged variants to Trixie. So beginning on
August 11, 2025, people's environments started breaking, but only on fresh docker pulls. Any
base image pulled before was silently on bookworm.

What about Trixie caused this hullabaloo? They bumped their `mysql` client from
`10.11.18-MariaDB` to `11.8.6-MariaDB`. MariaDB's 11.4 had switched the client to default to a TLS connection unless connecting over localhost. And here we were connecting in an obviously secure closed docker network, which you may notice is still distinctly not localhost. Hence the refusal.

The fix was simple - update the my.cnf to turn off that safety check, since this client is
only ever connecting in a closed network. That restored the old defaults, and our stack
was able to finish starting by itself once again.

I'd like to stop for a minute and lay out exactly what happened, because it's worth
looking at the stones that pave the road to a blank screen.

1. The MariaDB project decided that for security reasons, the client should
default to secure connections, thus refusing self-signed certificates. Fair; it's a security footgun that you want to protect
users from.
1. Debian pulled that into its latest release. Fair; .debs need to be updated
sometime or other, and users expect to have to get accustomed to new major releases of an
OS.
1. The official php docker image upgraded to latest Debian as their base. Fair; users
   should get security patches and newer goodies out of the box.
1. The php docker image tags got bumped in place. Fair^[honestly, this is a little bit
   less, but it's at least defensible]; otherwise you end up with an explosion of tags,
   and an arbitrary set running an older OS.
1. Our app container's init blocks on DB readiness. Fair; creating app keys and admin users needs a DB to store them in. Of course that should Just Work instead of
   be buried in documentation somewhere.
1. To check for DB readiness, we had a bash script using the `mysql` client as part of our
   app's local startup. Fair;^[in theory doing this check via the app would work, but it would be random dev code living in prod land] no reason to block the whole service on mysql if we can do
   stuff before we need the DB.
1. The check loop retried silently on errors in its query. Fair; this is how you can
   validate that the schema is ready, not just that the server is up. And you wouldn't
   want all the startup errors; they're expected and non-informative.

Well, this last one is the least "Fair;" of them all. I fully understand that the
init script was originally written in likely 5 minutes, to just get the stack up and never
think about it again. The problem is that it was wrong. And we should've known that it was
wrong, and seen a possible failure mode, and at the very least been loud in the
impossible case^[Nobody can expect [upstream](https://github.com/docker-library/php/blob/686f9529f8659f929509a2c3ec2df34a14a4594a/versions.sh#L81-L84) silently changing [upstream](https://packages.debian.org/trixie/mariadb-client) changing [upstream](https://mariadb.com/docs/release-notes/community-server/11.4/what-is-mariadb-114#:~:text=Clients%20now%20require%20SSL,enabled%20by%20default)].

There's one more thing that I discovered afterwards. A new dev had joined our team about
two months before I finally fixed this. For the entire time his dev env simply didn't
work. He never said a word about it. As far as he knew, it was just the job.
