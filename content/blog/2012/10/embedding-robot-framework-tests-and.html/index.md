---
title: Embedding Robot Framework tests and keywords into Sphinx documentation
date: "2012-10-22T06:00:00Z"
tags: ["Plone", "Python", "Robot Framework", "Sphinx", "Testing"]
---

[Robot Framework](http://code.google.com/p/robotframework/) ships with
decent tools for generating reference documentation out of your robot
keywords and test data (see
[libdoc](http://robotframework.googlecode.com/hg/doc/userguide/RobotFrameworkUserGuide.html?r=2.7.7#library-documentation-tool-libdoc)
and
[testdoc](http://robotframework.googlecode.com/hg/doc/userguide/RobotFrameworkUserGuide.html?r=2.7.7#test-data-documentation-tool-testdoc)).
Yet, when Timo Stollenwerk [presented Robot Framework as part of his is
talk about TDD at PloneConf
2012](http://de.slideshare.net/tisto/testdriven-development-with-plone),
the first question from the audience was, would you be able to include
tests as examples into *narrative* documentation of your package.

I\'m not sure, how much effort would it require to make Robot Framework
support *testable documentation* (similarly to
[doctest](http://docs.python.org/library/doctest.html)-module), or would
it even make any sense\...

The other way around, however, is easy.

Introducing sphinxcontrib-robotdoc
----------------------------------

[Sphinx](http://sphinx.pocoo.org/) is the current state-of-art document
generation tool of the Python community. Sphinx is based on
[Docutils](http://docutils.sourceforge.net/), which makes it very easy
to [extend](http://sphinx.pocoo.org/extensions.html) its
[reStructuredText](http://docutils.sourceforge.net/rst.html)-markup with
custom directives.

There\'s also a real killer app for it:
[ReadTheDocs](https://readthedocs.org/).

So, in the spirit [autodoc](http://sphinx.pocoo.org/ext/autodoc.html)
extension for Sphinx, I wanted to use my sprint time at the PloneConf
for starting up a new Sphinx extension for embedding Robot Framework
tests and user keywords into narrative package documentation.

This work is now available as:
[sphinxcontrib-robotdoc](http://pypi.python.org/pypi/sphinxcontrib-robotdoc/).

And robot\_-directives
----------------------

`sphinxcontrib-robotdoc` introduces two new custom Docutils-directives
to be used in Sphinx documentation:

1.  `robot_tests` and
2.  `robot_keywords`.

Both directives accept 1) optional regular expression filter and 2)
mandatory **source**-option with a relative path to locate your Robot
Framework test data or resource file. In addition,
`robot_tests`-directive accepts also an 3) optional comma separated list
of **tags** to select embedded tests from the parsed test data.

For example:

1.  Embed all tests from a test suite:

    ```rst
    .. robot_tests::
        :source: ../src/my_package/tests/acceptance/my_suite.txt
    ```

2.  Embed all tests starting with **Log in** from a test suite:

    ```rst
    .. robot_tests:: Log in.*
       :source: ../src/my_package/tests/acceptance/my_suite.txt
    ```

3.  Embed all tests tagged with **login** or **logout** from a test
    suite:

    ```rst
    .. robot_tests::
       :source: ../src/my_package/tests/acceptance/my_suite.txt
       :tags: login, logout
    ```

4.  Embed all user keywords from a test or a resource file:

    ```rst
    .. robot_keywords::
       :source: ../src/my_package/tests/acceptance/my_suite.txt
    ```

5.  Embed all user keywords starting with **Log in** from a test or a
    resource file:

    ```rst
    .. robot_keywords:: Log in.*
       :source: ../src/my_package/tests/acceptance/my_suite.txt
    ```

When test cases or user keywords contain documentation, it gets parsed
with something called **nested** Docutils parser. This supports also
links between keywords and links from narrative to keywords as long as
both the link and its target are embedded onto the same Sphinx page.

Enabling for ReadTheDocs
------------------------

If you are new to [ReadTheDocs](https://readthedocs.org/), you should start with their [Getting
Started](http://read-the-docs.readthedocs.org/en/latest/getting_started.html)
-guide.

ReadTheDocs does support custom Sphinx-plugins (the ones that are not
distributed with Sphinx\'s main distribution), but there are a few
things to know about it:

1.  As usual, you must add the plugin into the extensions list of your
    Sphinx configuration (usually `conf.py`). Also, remember to convert
    dashes in package names to underscores:

    ```python
    extensions = ['sphinxcontrib_robotdoc']
    ```

2.  The required plugin must be published (probably at
    [PyPi](http://pypi.python.org/)) like
    [sphinxcontrib-robotdoc](http://pypi.python.org/pypi/sphinxcontrib-robotdoc/).

3.  You must edit your ReadTheDocs-project through their dashboard to
    **Use virtualenv**:

    ```
    Use virtualenv
    [x]  Install your project inside a virtualenv using setup.py install
    ```

4.  Your package must include a [pip requirements
    file](http://www.pip-installer.org/en/latest/requirements.html)
    requiring the Sphinx plugin (and the possibly required minimum
    version) you are using:

    ```properties
    sphinxcontrib-robotdoc>=0.3.4
    ```

5.  The requirements file itself could be made specific for ReadTheDocs
    by placing it under a package subdirectory, e.g.
    `./docs/requirements.txt`.

6.  Finally, your must edit your ReadTheDocs-project through their
    dasboard to find your requirement file:

    ```
    Requirements file:
    docs/requirements.txt
    ```

Done. Now, the next ReadTheDocs-build for your documentation should be
able to use your custom Sphinx-plugin, e.g. `sphinxcontrib-robotdoc`.

With a full example
-------------------

At the PloneConf, I had a presentation with [Jukka
Ojaniemi](https://twitter.com/jukkao) on doing [AMQP based system
integrations for
Plone](http://www.slideshare.net/datakurre/plone-rabbit-mq-and-messaging-that-just-works).
For the presentation, I wrote [a minimal publish-subscribe -example for
Plone](https://github.com/datakurre/pubsubannouncements/) containing
also a pair of acceptance tests written with Robot Framework.

Here goes my

-   [Sphinx-configuration](https://github.com/datakurre/pubsubannouncements/blob/master/docs/conf.py)
-   [pip requirements
    -file](https://github.com/datakurre/pubsubannouncements/blob/master/docs/requirements.txt)
-   [documentation
    source](https://github.com/datakurre/pubsubannouncements/blob/master/docs/index.rst)
-   [Robot Framework test
    data](https://github.com/datakurre/pubsubannouncements/blob/master/src/pubsubannouncements/tests/test_announcement.txt)

and, finally, [the results at
ReadTheDocs](http://zamqp-pubsubannouncements.readthedocs.org/en/latest/).

And then what?
--------------

So, if you do acceptance driven development, shouldn\'t your acceptance
criteria be good enough to be embedded as examples of your product\'s
usage into its narrative documentation?

Actually, I don\'t want to argue more on that\... I\'ll describe a real
use case instead:

[plone.act](https://github.com/plone/plone.act/) is the new acceptance
test library for Plone and Plone add-on-developers. It is implemented as
an importable resource of Robot Framework user keywords built on top of
Robot Framework\'s [built-in
keywords](http://robotframework.googlecode.com/hg/doc/libraries/BuiltIn.html?r=2.7.7)
and
[Selenium2Library-keywords](http://rtomac.github.com/robotframework-selenium2library/doc/Selenium2Library.html).
Of course, it\'s still far from complete.

For plone.act, we do need to write [a narrative tutorial-like
documentation](http://ploneact.readthedocs.org/en/latest/index.html),
including descriptions of the available keywords and examples of their
use in custom test cases. The best way to do this and keep it in sync
with the current implementation, I believe, would be to embed the actual
keywords and tests cases into the documentation.

And, I hope, we can do that with
[sphinxcontrib-robotdoc](http://pypi.python.org/pypi/sphinxcontrib-robotdoc/)
and enhance it a lot during the process.
