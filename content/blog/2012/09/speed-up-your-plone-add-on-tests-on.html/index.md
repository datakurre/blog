---
title: Speed up your Plone add-on tests on Travis CI with the Unified Installer
date: "2012-09-09T06:00:00Z"
tags: ["Plone", "Testing", "Travis CI"]
---

Many thanks for Héctor Verlarde for [encouraging us to try out Travis CI
for testing our own Plone
add-ons](http://hvelarde.blogspot.fi/2012/08/integrating-travis-ci-with-your-plone.html).
Also, thanks for Godefroid Chapelle for showing me, [how to run Selenium
tests on a headless
server](https://github.com/gotcha/collective.jekyll/blob/master/.travis.yml#L13),
e.g. on [Travis
CI](http://about.travis-ci.org/docs/user/gui-and-headless-browsers/).

As you may already know, the main issue in testing Plone add-ons on
Travis CI is its **strict 15 minute time limit on running your test
suite**. And as you may also know, 15 minutes is not much time for our
dear buildout to gather all the required dependencies of Plone or
[plone.app.testing](http://pypi.python.org/pypi/plone.app.testing/), and
still run our test after the buildout.

As expected, neither did I get far without having issues with the time
limit. And for some reason, I couldn\'t get the earlier solutions to
work for me. Eventually, I found out a new solution, surprisingly, with
the help of [Plone Unified
Installer](http://plone.org/products/plone/releases/).

Because **Plone Unified Installer comes in a single downloadable package
and includes a complete buildout-cache** usable also in a test buildout,
I realized, that it could speed up my test buildout a lot, and it did.
Yet, with Plone 4.3 shipping with Dexterity, I would expect it to speed
it up even more.

**Update**: The method described here is adopted as part of
[buildout.plonetest](https://github.com/collective/buildout.plonetest),
which includes more generic configuration to work with all
Plone-versions.

Enough talk. Here\'s my setup:

buildout.cfg
------------

```properties
[buildout]
extends = http://dist.plone.org/release/4.2.1/versions.cfg
develop = .
parts = test
versions = versions

[test]
recipe = zc.recipe.testrunner
eggs = my_package[test]
```

Nothing special here. I expect `setup.py` of the tested package to
include complete `extras_require={'test': ... }` with all the required
dependencies for testing.

So, on a local machine, `python bootstrap.py`, `bin/buildout` and
`bin/test` combo should run tests for a freshly cloned package
repository just as expected.

travis.cfg
----------

```properties
[buildout]
extends = buildout.cfg
parts =
    download
    install
    test
eggs-directory = buildout-cache/eggs
download-cache = buildout-cache/downloads

[download]
recipe = hexagonit.recipe.download
url = https://launchpad.net/plone/4.2/4.2.1/+download/Plone-4.2.1-UnifiedInstaller.tgz

[install]
recipe = collective.recipe.cmd
on_install = true
cmds = tar jxvf ${download:location}/Plone-4.2.1-UnifiedInstaller/packages/buildout-cache.tar.bz2 1>/dev/null
```

Here\'s the magic for re-using Plone Unified Installer for your test
buildout:

1.  At first, download and unpack the installer in `[download]` part
2.  then extract its **buildout-cache** in `[install]` part into the
    locations defined in `[buildout]` part.

As you might guessed, after this, buildout needs to download only the
extra requirements of the tested package! Long live Plone Unified
Installer!

.travis.yml
-----------

```yaml
language: python
python: "2.7"
install:
  - mkdir -p buildout-cache/downloads
  - python bootstrap.py -c travis.cfg
  - bin/buildout -N -t 3 -c travis.cfg
script: bin/test
```

Note, how we need to create a **buildout-cache**-directory for downloads
as defined earlier in `travis.cfg`. The rest should be easy: we just do
the bootstrap and run our tests with sane buildout-options, and\...
that\'s all.

.travis.yml for robotsuite
--------------------------

Oh, in the beginning, I mentiond about learning something important from
Godefroid. Well, if you have followed me on [creating
zope.testrunner-compatible Robot Framework -tests with
plone.app.testing](http://datakurre.pandala.org/2012/09/getting-started-with-robotframework-and.html),
you only need to add a few extra lines to make your Robot Framework
tests runnable on Travis CI:

```yaml
language: python
python: "2.7"
install:
  - mkdir -p buildout-cache/downloads
  - python bootstrap.py -c travis.cfg
  - bin/buildout -N -t 3 -c travis.cfg
before_script:
  - "export DISPLAY=:99.0"
  - "sh -e /etc/init.d/xvfb start"
script: bin/test
```

If you think, this is cool, please, [give some love for the Travis CI
team](https://love.travis-ci.org)!
