---
title: Make your Robot tests go Phantom
date: "2013-04-27T06:00:00Z"
tags: ["phantomjs", "plone", "robot framework", "selenium"]
---

A new version of
[robotframework-selenium2library](https://pypi.python.org/pypi/robotframework-selenium2library/)
has just been released, and it (`>= 1.2.0`) comes with full support for
[PhantomJS](http://phantomjs.org/), the famous **headless** WebKit
browser. Thanks a lot to [Jeremy](https://github.com/j1z0) for cutting
that release and
[GhostDriver](https://github.com/detro/ghostdriver)-project for the
actual WebDriver-driver for PhantomJS.

To make the story short:

1.  [Download PhantomJS](http://phantomjs.org/download.html)
    (`>= 1.8.0`), unpack it and place the `phantomjs`-binary somehere on
    your path so that it can be located by the Selenium bindings for
    Python.
2.  Update your Selenium-packages (for Plone, update version pins and do
    the buildout). You\'ll need at least Selenium `>= 2.28.0` and
    robotframework-selenium2library `>=1.2.0`.
3.  Execute your tests so that the **Open Browser**-keyword of
    Selenium2Library will be called with a named argument
    `browser=phantomjs`. See also [the keyword
    documentation](http://rtomac.github.io/robotframework-selenium2library/doc/Selenium2Library.html#Open%20Browser).

With
[plone.app.robotframework](http://pypi.python.org/pypi/plone.app.robotframework)
([tutorial](http://developer.plone.org/reference_manuals/external/plone.app.robotframework/happy.html))
and a buildout environment, you can do part 3. simply with

```shell
$ bin/robot -v BROWSER:phantomjs ...
```

when you are running tests against `bin/robot-server` as recommended
while writing your tests.

Or

```shell
$ ROBOT_BROWSER=phantomjs bin/test -t ...
```

when you are running test with `zope.testrunner` as recommended with a
CI setup.
