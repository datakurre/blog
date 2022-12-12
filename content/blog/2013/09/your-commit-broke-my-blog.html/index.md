---
title: Blogging examples of use with automated screenshots
date: "2013-09-23T06:00:00Z"
tags: ["Doctest", "Plone", "Robot Framework", "Screenshots", "Selenium", "Sphinx", "Testing"]
---

> But how much does it makes sense to write acceptance tests while
> creating screenshots for new blog posts presenting Plone add-ons?

I have a new experimental project:

<p style="text-align: center;"><iframe width="420" height="315" src="http://www.youtube.com/embed/cYN5tQJ3xtc" frameborder="0" allowfullscreen></iframe></p>

What you should see, is A Sphinx-built blog written in ReStructuredText
being built, including annotated screenshots generated from embedded
Robot Framework -acceptance tests describing a Plone add-on.
(Technically, each blog post could present different add-ons.)

The resulting blog could be hosted on GitHub, served via GitHub-pages
and it should be possible to edit it collaborately using
branching/forking and pull-requests.

I\'m not sure if this would really work out, and won\'t include this in
Planet yet, but you can see the preview at

-   <http://elvenmagic.pandala.org/>

and example configuration with [raw
posts](https://github.com/datakurre/elvenmagic/blob/gh-pages/2013/09/22/collective-listingviews.rst)
at

-   <http://github.com/datakurre/elvenmagic/>

and ping me at Twitter or IRC, if you are interested in participating.

Ingredients
-----------

-   [sphinxcontrib-robotframework](http://pypi.python.org/pypi/sphinxcontrib-robotframework)
    is a [Robot Framework](http://robotframework.org) integration for
    Sphinx, which is created by me and Vivek Kumar Verma as a
    [GSOC2013](https://www.google-melange.com/gsoc/project/google/gsoc2013/vivekkodu/16001)-project,
    which I mentored.
-   [robotframework-selenium2screenshots](http://pypi.python.org/pypi/sphinxcontrib-robotframework)
    is a [PIL](http://pypi.python.org/pypi/PIL) and jQuery-based
    screenshot annotation and cropping library for Robot Framework,
    which I started during
    [PLOG2013](http://www.abstract.it/en/abstract/initiative/plog-2013)
    for
    [plone.app.robotframework](http://pypi.python.org/pypi/plone.app.robotframework),
    but released as a separate package to make it available outside
    Plone-projects also. Of course, it requires also
    [robotframework-selenium2library](http://pypi.python.org/pypi/sphinxcontrib-robotframework).
-   [plone.app.robotframework](http://pypi.python.org/pypi/plone.app.robotframework)
    comes with Godefroid Chapelle\'s *Zope2Server*-library, which allows
    to start Plone test fixtures directly from [Robot
    Framework](http://robotframework.org) test suites (without
    [zope.testrunner](http://pypi.python.org/pypi/zope.testrunner) or
    [robotsuite](http://pypi.python.org/pypi/robotsuite)).
-   [Tinkerer](http://tinkerer.me/) is a blogging engined built on top
    of [Sphinx](http://sphinx-doc.org/) written by Vlad Riscutia.
