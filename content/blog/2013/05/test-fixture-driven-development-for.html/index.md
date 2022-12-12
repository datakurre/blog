---
title: Test fixture driven development for Plone add-ons?
date: "2013-05-10T06:00:00Z"
tags: ["Plone", "Testing"]
---

You may have already seen [Maurizio Delmonte\'s
demo](http://www.youtube.com/watch?v=h_rsSL1e4i4) of
[collective.cover](http://pypi.python.org/pypi/collective.cover), the
new [Tiles](http://pypi.python.org/pypi/plone.tiles) based front-page
product for [Plone](http://plone.org). It\'s based on the same
technologies as [Deco](http://www.screencast.com/t/1BFjd89Xio), but it
actually delivers. Just amazing work from our South American Plone
friends.

Here\'s a new (developer) way to try out this wonderful product:

1.  Download `bootstrap.py`

    ```shell
    $ curl -O http://downloads.buildout.org/2/bootstrap.py
    ```

2.  Write `buildout.cfg`

    ```properties
    [buildout]
    extends = http://dist.plone.org/release/4.3-latest/versions.cfg
    versions = versions
    parts = robot

    [robot]
    recipe = zc.recipe.egg
    eggs =
        collective.cover[test]
        plone.app.robotframework

    [versions]
    # These versions are from collective.cover/versions.cfg
    collective.js.jqueryui = 1.10.1.2
    plone.app.blocks = 1.0
    plone.app.drafts = 1.0a2
    plone.app.jquery = 1.7.2
    plone.app.jquerytools = 1.5.5
    plone.app.tiles = 1.0.1
    plone.tiles = 1.2
    ```

3.  Run the buildout

    ```shell
    $ python bootstrap.py
    $ bin/buildout
    ```

4.  Start the installed `bin/robot-server` with a specific functional
    test fixture shipped in [collective.cover](http://pypi.python.org/pypi/collective.cover)

    ```shell
    $ bin/robot-server collective.cover.testing.FUNCTIONAL_TESTING
    ```

5.  Wait for `bin/robot-server` to start a volatile demo instance for
    you

    ```shell
    12:05:09 [ wait ] Starting Zope 2 server
    12:05:41 [ ready ] Started Zope 2 server
    ```

6.  Open browser at <http://localhost:55001/plone/>

7.  Login with username `admin` and password `secret`, click *Add new
    \...*-menu to add a new cover and have fun.

<p style="text-align: center;"><iframe width="420" height="315" src="http://www.youtube.com/embed/uegWBNyR888" frameborder="0" allowfullscreen></iframe></p>

Wait\... what just happened?

Meet the robot-server
---------------------

*robot-server* is a test fixture based development server for Plone
add-on development, and is currently shipped with
[plone.app.robotframework](http://pypi.python.org/pypi/plone.app.robotframework).
It\'s main function is to ease writing of [Robot
Framework](http://robotframework.org/) tests for Plone, but it can be
used as a more general development tool.

About a year ago, [Godefroid Chapelle](https://twitter.com/__gotcha)
figured out that we could re-use Plone\'s and its add-ons\' modern test
fixtures (see
[plone.app.testing](http://pypi.python.org/pypi/plone.app.testing)) to
start a testable Plone sandbox directly from Robot Framework\'s own test
runner. Even better finding was that you could re-use the test fixtures
to start a Plone sandbox in a way that you could ran multiple isolated
Robot Framework test against it with running expensive setups and
teardowns only once. This work was finished at [the Barcelona Plone
Testing
Sprint](http://wnww.coactivate.org/projects/barcelona-sprint/project-home)
in the last February.

To see better, how test fixtures are set up by robot-server, run it with
`-v` for `--verbose`:

```shell
$ bin/robot-server collective.cover.testing.FUNCTIONAL_TESTING -v
12:07:10 [ wait ] Starting Zope 2 server
12:07:10 [ wait ] Set up plone.testing.zca.LayerCleanup
12:07:10 [ wait ] Set up plone.testing.z2.Startup
12:07:10 [ wait ] Set up plone.app.testing.layers.PloneFixture
12:07:18 [ wait ] Set up collective.cover.testing.Fixture
12:07:25 [ wait ] Set up plone.testing.z2.ZServer
12:07:26 [ wait ] Set up collective.cover.testing.collective.cover:Functional
12:07:26 [ ready ] Started Zope 2 server
```

But that\'s not all.

robot-server, reloaded
----------------------

1.  Write the following `develop.cfg` (on a Mac or Linux) next to the
    previous `buildout.cfg`

    ```properties
    [buildout]
    extends = buildout.cfg
    extensions = mr.developer
    auto-checkout = collective.cover

    [sources]
    collective.cover = git https://github.com/collective/collective.cover.git

    [robot]
    eggs += plone.app.robotframework[reload]
    ```

2.  Run the buildout

    ```shell
    $ bin/buildout -c develop.cfg
    ```

3.  Start `bin/robot-server`

    ```shell
    $ bin/robot-server collective.cover.testing.FUNCTIONAL_TESTING -v
    12:26:25 [ wait ] Starting Zope 2 server
    12:26:25 [ wait ] Set up plone.testing.zca.LayerCleanup
    12:26:25 [ wait ] Set up plone.testing.z2.Startup
    12:26:25 [ wait ] Set up plone.app.testing.layers.PloneFixture
    12:26:33 [ wait ] Watchdog is watching for changes in src
    12:26:33 [ wait ] Fork loop now starting on parent process 98241
    12:26:33 [ wait ] Fork loop forked a new child process 98244
    12:26:33 [ wait ] Set up collective.cover.testing.Fixture
    12:26:40 [ wait ] Set up plone.testing.z2.ZServer
    12:26:41 [ wait ] Set up collective.cover.testing.collective.cover:Functional
    12:26:41 [ ready ] Zope 2 server started
    ```

4.  Edit a file under `src/collective/cover` and see how the sandbox is
    teared down to `PLONE_FIXTURE` and all code for [collective.cover](http://pypi.python.org/pypi/collective.cover)
    is being reloaded

    ```shell
    12:27:49 [ wait ] Watchdog got modified event on collective.cover/src/collective/cover/config.py
    12:27:49 [ wait ] Pruning Zope 2 server
    12:27:49 [ wait ] Tear down collective.cover.testing.collective.cover:Functional
    12:27:49 [ wait ] Tear down plone.testing.z2.ZServer
    12:27:50 [ wait ] Tear down collective.cover.testing.Fixture
    12:27:50 [ wait ] Fork loop terminated child process 98244
    12:27:50 [ wait ] Fork loop forked a new child process 98536
    12:27:50 [ wait ] Set up collective.cover.testing.Fixture
    12:27:57 [ wait ] Set up plone.testing.z2.ZServer
    12:27:58 [ wait ] Set up collective.cover.testing.collective.cover:Functional
    12:27:58 [ ready ] Zope 2 server started
    ```

<p style="text-align: center;"><iframe width="420" height="315" src="http://www.youtube.com/embed/cDwAku2ZUqs" frameborder="0" allowfullscreen></iframe></p>

In short, when [plone.app.robotframework](http://pypi.python.org/pypi/plone.app.robotframework) is required with `[reload]`
it comes with a code reloading fork loop applied from
[sauna.reload](http://pypi.python.org/pypi/sauna.reload). It is not as
fast as the original, but this time it works for all add-ons. And it
does not only reload your code, but also re-builds your test fixture.
For example, all changes for add-on Generic Setup profile are applied
when the profile is configured in test fixture.

So, may be next time, when you start writing a new add-on for Plone, you
could start with writing a functional test fixture for it (see
[plone.app.testing](http://pypi.python.org/pypi/plone.app.testing) and include a z2.ZSERVER\_FIXTURE) and give
`robot-server` a spin.

Issues can be filed at
[GitHub](https://github.com/plone/plone.app.robotframework/). Thank you.
