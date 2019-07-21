---
title: Overview of the new Robot Framework goodies for Plone
date: "2013-02-11T06:00:00Z"
tags: ["plone", "robot framework", "selenium", "testing"]
---

Greetings from [Plone testing
sprint!](http://www.coactivate.org/projects/barcelona-sprint/project-home)

I had never been in Barcelona before, and to be honest, I didn\'t really
see much of the city yet. The sprint, however, was great, fun and well
organized. Thank you Ramon, Timo and [iskraTIC](iskra.cat/en/) folks!
Also, thanks to my employer, [University of
Jyväskylä](https://www.jyu.fi/en/) for allowing and sponsoring me to
participate the sprint.

In the beginning of the sprint I gave others short introduction on
writing functional Selenium test for Plone with [Robot
Framework](http://code.google.com/p/robotframework/). At the end of the
sprint, I was already learning new robot tricks from them. Thanks
Carles, Kees, Laura and Víctor. Amazing.

Oh, the goodies:

Tutorials
---------

[plone.act](http://ploneact.readthedocs.org/) has now to-the-point
tutorials for writing robot tests for a new (templer based) or existing
add-on.

They are not reference manuals (yet), but with some good examples they
should give you a good start for writing robot tests for Plone.

Templer templates
-----------------

[templer.plone](http://pypi.python.org/pypi/templer.plone) (From version
1.0b4), thanks to Maik Röder, has now a new question for populating the
created product with a functional robot test example.

plone.app.testing\[robot\]
--------------------------

[plone.app.testing](http://pypi.python.org/pypi/plone.app.testing) (from
version 4.2.2) can now be required in your `setup.py` with `[robot]`
extras to require all the needed dependencies for writing and running
functional Selenium tests for Plone with robot.

Robot test server
-----------------

**plone.act** repository has included a **secret** development server
called
[act\_server](http://ploneact.readthedocs.org/en/latest/server.html). It
can start a temporary Plone site with the given testing layer
configured. Instead of running tests on top if it itself, however, it
just leaves the site on, and allows you to test it with any tools you
can imagine (even with a browser).

The server was originally written by Godefroid Chapelle for months ago,
but we finally managed to finish it to support test isolation with
`pybot` \-- the default test runner installed with Robot Framework.

So, now `act_server` makes it possible you to run your unfinished tests
over and over again with `pybot` against a real test layer based Plone
sandbox, with test isolation, but without needing to wait for the
expensive test layer setup and teardown.

It\'s awesome.

Robot remote library example for Plone
--------------------------------------

In BDD-style tests it should be possible to prepare tests in
**Given**-clauses, preferably as fast as possible (= without Selenium).

**plone.act** repository contains now an example on, [how to create a
robot remote library in Plone
site](http://ploneact.readthedocs.org/en/latest/remote.html) during test
layer setup, populate it with keywords written in Python, and then run
those keywords like any other keywords in robot tests.

Because robot will call those keywords through XML-RPC, you can e.g.
create and delete objects without need to think about transactions or
commits by yourself.

That\'s all
-----------

No plone.act release? I\'m sorry.

We are not yet sure, if there\' really need for a separate package
(plone.act), or should the stuff currently in plone.act be moved into
existing packages, mainly into
[plone.testing](http://pypi.python.org/pypi/plone.testing/) and
[plone.app.testing](http://pypi.python.org/pypi/plone.app.testing).

plone.act will not disappear, but until we have agreed on where the
robot stuff for Plone should live, it may remain only as a development
sandbox. Although, you can still checkout it (e.g. with
[mr.developer](http://pypi.python.org/pypi/mr.developer/)), to use it in
development and make internal releases out of it.

Of course, also many other things were completed during the sprint, but
I\'m sure that there will be other reports focusing on them.
