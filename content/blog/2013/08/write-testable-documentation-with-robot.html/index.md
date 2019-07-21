---
title: Write testable documentation with Robot Framework
date: "2013-08-15T06:00:00Z"
tags: ["doctest", "plone", "robot framework", "testing"]
---

If you have background as a Python programmer, you must be familiar with
[doctests](http://docs.python.org/2/library/doctest.html) \-- testable
code examples embedded into documentation. When Timo Stollenwerk
presented Robot Framework in his [TDD-presentation in Plone Conference
2012](http://www.slideshare.net/tisto/testdriven-development-with-plone),
the first question from the audience was, can Robot Framework test be in
embedded into documentation, similarly to Python doctests.

Soon you can.

I\'ve been mentoring Vivek Kumar Verma in this years Google Summer of
Code to implement a [better ReStructureText parser into Robot
Framework](https://www.google-melange.com/gsoc/project/google/gsoc2013/vivekkodu/16001).
The first part of his GSOC project was to actually enhance the parser,
and the second part is implementing a Sphinx-plugin to execute embedded
Robot Framework tests while compiling the documentation. You can follow
Vivek\'s dive into Python world in [his
blog](http://vivekkodugsoc13.blogspot.in/) and find him as `viku__` on
[Freenode](http://freenode.net/)-channels *\#plone* and
*\#robotframework*.

Issues related to Vivek\'s GSOC 2013 work for the enhanced ReST-parser
can be filed at <https://github.com/datakurre/robotframework/issues>
until the GSOC ends.

How does it work?
-----------------

As you may have guessed from the title. The first part of Vivek\'s GSOC
is pretty much completed and is waiting for a review from the Robot
Framework team. It\'s a minimal, but very powerful enhancement for the
old Robot Framework\'s ReST parser. While the old parser supported only
so called table syntax, the new parser allows you to use the famous
[plain text
format](http://robotframework.googlecode.com/hg/doc/userguide/RobotFrameworkUserGuide.html?r=2.8.1#plain-text-format)
when embedding your Robot Framework tests into ReST-documents.

Try to find the test cases from the following
[ReStructuredText](http://docutils.sourceforge.net/rst.html)-example:

```rst
Your first Robot Framework doctest
==================================

With the Robot Framework plain text syntax, a minimal test suite
would consists of ``*** Test Cases ***`` header and at least
one test case, like:

.. code:: robotframework

   *** Test Cases ***

   Foo is always Foo
       Should be equal  Foo  Foo

One ``*** Test Cases ***``-header may be followed by as many
tests as required, like:

.. code:: robotframework

   *** Test Cases ***

   Foo is still Foo
       Should be equal  Foo  Foo

   Foo is never Bar
       Should not be equal  Foo  Bar
```

With Vivek, we decided to re-use the existing `code`-directive of
Docutils for embedding plain text Robot Framework tests suites into
ReStructuredText-documents. Each document can contain as many
`code`-directives with `robotframework`-language as required and Robot
Framework will concatenate their contents into a single Robot Framework
test suite.

There is a small price, of course. Docutils will tag `code`-directives
with `robotframework`-language only when also
[Pygments](http://pygments.org)-package is installed. Luckily you will
want to have it, because since with Pygments (`>= 1.6`) you will also
get syntax highlighting your embedded Robot Framework tests.

Try it out
----------

Even Vivek\'s GSOC-work has not been merged into Robot Framework yet,
you can try it out with the following steps:

1.  [Create and activate a new Python virtual
    environment](https://pypi.python.org/pypi/virtualenv).

2.  Install the dependencies:

    ```shell
    $ pip install docutils Pygments
    ```

3.  Install GSOC-patched version of Robot Framework 2.8.1:

    ```shell
    $ pip install https://github.com/datakurre/robotframework/tarball/GSOC2013DEMO/robotframework-2.8.1-GSOC2013.0.tar.gz
    ```

4.  Create an example test suite `example.rst`:

    ```rst
    Your first Robot Framework doctest
    ==================================

    With the Robot Framework plain text syntax, a minimal test suite
    would consists of ``*** Test Cases ***`` header and at least
    one test case, like:

    .. code:: robotframework

       *** Test Cases ***

       Foo is always Foo
           Should be equal  Foo  Foo

    One ``*** Test Cases ***``-header may be followed by as many
    tests as required, like:

    .. code:: robotframework

       *** Test Cases ***

       Foo is still Foo
           Should be equal  Foo  Foo

       Foo is never Bar
           Should not be equal  Foo  Bar
    ```

5.  Run the suite:

    ```shell
    $ pybot example.rst

    ========================================================================
    Example
    ========================================================================
    Foo is always Foo                                               | PASS |
    ------------------------------------------------------------------------
    Foo is still Foo                                                | PASS |
    ------------------------------------------------------------------------
    Foo is never Bar                                                | PASS |
    ------------------------------------------------------------------------
    Example                                                         | PASS |
    3 critical tests, 3 passed, 0 failed
    3 tests total, 3 passed, 0 failed
    ========================================================================
    Output:  /.../output.xml
    Log:     /.../log.html
    Report:  /.../report.html
    ```

6.  And create a nicely highlighted documentation:

    ```shell
    $ pygmentize -S default -f html > colors.css
    $ rst2html.py --syntax-highlight=short --stylesheet-path=colors.css example.rst > example.html
    ```

A mandatory Plone example
-------------------------

Yes, you can also embed a Plone example into a short ReST-document.

1.  As always, we need a `bootstrap.py`:

    ```shell
    $ curl -O http://downloads.buildout.org/2/bootstrap.py
    ```

2.  And `buildout.cfg`:

    ```properties
    [buildout]
    extends = http://dist.plone.org/release/4.3-latest/versions.cfg
    find-links =
        https://github.com/datakurre/robotframework/tarball/GSOC2013DEMO/robotframework-2.8.1-GSOC2013.0.tar.gz
    versions = versions
    parts = robot

    [versions]
    robotframework = 2.8.1-GSOC2013.0

    [robot]
    recipe = zc.recipe.egg
    eggs =
        docutils
        Pygments
        plone.app.robotframework
    scripts = pybot
    ```

3.  Run the buildout:

    ```shell
    $ python bootstrap.py
    $ bin/buildout
    ```

4.  Add the following `plone.rst`:

    ```rst
    Adding a new page in Plone
    ==========================

    .. raw:: html

       <!-- This class allows us to hide the test setup part -->
       <style type="text/css">.hidden { display: none; }</style>

    .. code:: robotframework
       :class: hidden

       *** Settings ***

       Resource  plone/app/robotframework/server.robot

       Suite Setup  Setup
       Suite Teardown  Teardown
       Test Setup  Test Setup
       Test Teardown  Test Teardown

        *** Keywords ***

        Setup
            Setup Plone site  plone.app.robotframework.testing.AUTOLOGIN_ROBOT_TESTING

        Test Setup
            Import library  Remote  ${PLONE_URL}/RobotRemote
            Enable autologin as  Site Administrator
            Set autologin username  test-user-1

        Test Teardown
            Set Zope layer  plone.app.robotframework.testing.AUTOLOGIN_ROBOT_TESTING
            ZODB TearDown
            ZODB SetUp

        Teardown
            Teardown Plone Site

    This is how you can test adding new document in Plone, once your test user
    has logged in with enough permissions.

    .. code:: robotframework

        *** Test Cases ***

        Add new page
            Go to  ${PLONE_URL}

            Click link  css=#plone-contentmenu-factories dt a
            Element should be visible
            ...    css=#plone-contentmenu-factories dd.actionMenuContent

            Click link  css=a#document
            Wait Until Page Contains Element  css=#archetypes-fieldname-title input

            Input Text  title  This is the title
            Input Text  description  This is the summary.

            Click button  Save
            Element should contain  css=#parent-fieldname-title  This is the title

            Capture page screenshot  new-page.png

    And if the test is successful, you will see the resulting image below:

    .. image:: new-page.png
    ```

5.  Run the suite:

    ```shell
    $ bin/pybot plone.rst
    ========================================================================
    Plone
    ========================================================================
    Add new page                                                    | PASS |
    ------------------------------------------------------------------------
    Plone                                                           | PASS |
    1 critical test, 1 passed, 0 failed
    1 test total, 1 passed, 0 failed
    ========================================================================
    Output:  /.../output.xml
    Log:     /.../log.html
    Report:  /.../report.html
    ```

6.  And (if you have Pygments and Docutils installed into your current
    path) create a nicely highlighted documentation:

    ```shell
    $ pygmentize -S default -f html > colors.css
    $ rst2html.py --syntax-highlight=short --stylesheet-path=colors.css plone.rst > plone.html
    ```

I\'m not sure if it will be possible (or even reasonable) to write
actual tests in such a descriptive language that they can be included
into final documentation. Yet, embedding screenshot-resulting tests into
documentation would make sense, because those would keep documentation
screenshots up to date and would also work as acceptance tests for the
documented features.

That\'s why the rest of Vivek\'s GSOC will be about running the tests
within Sphinx: the same compilation run could both execute tests to
create screenshots and include those screenshots into the final
documentation.
