---
title: Documentation – a plausible excuse for acceptance testing
date: "2013-09-20T06:00:00Z"
tags: ["plone", "robot framework", "selenium", "sphinx"]
---

> Or how to use [Sphinx](http://sphinx-doc.org/) to create user guides
> with screenshots, which are automatically generated, annotated and
> kept up-to-date using [Robot Framework](http://robotframework.org/)
> and
> [Selenium](http://pypi.python.org/pypi/robotframework-selenium2library).
>
> <p style="text-align: center;"><iframe width="420" height="315" src="http://www.youtube.com/embed/87G4QiIqQCY" frameborder="0" allowfullscreen></iframe></p>

I\'m sure that this is not the first time when someone proposes to mix
documentation with acceptance testing, but this time it *should* feel
different.

Any decent user documentation should include a good amount of
screenshots. Unfortunately, good screenshots are pain to make, edit and
keep up-to-date\...

I\'ve been mentoring Vivek Kumar Verma in this years Google Summer of
Code to implement a [better ReStructureText parser into Robot
Framework](https://www.google-melange.com/gsoc/project/google/gsoc2013/vivekkodu/16001).
A part of his GSOC project was to implement a Sphinx-plugin to execute
embedded Robot Framework tests while compiling the documentation.

Now, after a summer of co-operation with me and Vivek around this GSOC
topic, I have good news for you all:

How to create a new Sphinx-based documentation with generated screenshots
-------------------------------------------------------------------------

1.  [Create and activate a new Python
    virtualenv.](http://www.virtualenv.org/)

2.  Install package
    [sphinxcontrib-robotframework](http://pypi.python.org/pypi/sphinxcontrib-robotframework)
    with *docs*-extras to get all the required packages for executing
    [Selenium](http://pypi.python.org/pypi/robotframework-selenium2library)-tests
    with
    [robotframework-selenium2screenshots](http://pypi.python.org/pypi/robotframework-selenium2screenshots)-library:

    ```shell
    $ pip install 'sphinxcontrib-robotframework[docs]'
    ```

3.  Create a source directory for you documentation:

    ```shell
    $ mkdir source
    ```

4.  Create a minimal Sphinx-configuration file with our plugin enabled
    by creating the following `./source/conf.py`:

    ```python
    extensions = ['sphinxcontrib_robotframework']
    master_doc = 'index'
    ```

5.  Dump the following example documentation into `./source/index.rst`:

    ```restructuredtext
    How to vote in Plone Innovation Awards?
    ---------------------------------------

    Choose your nominee by going to http://ploneawards.com/ and clicking the
    next button until you find something you like:

    .. image:: choosing-nominee.png
       :width: 800

    Once you have found your favorite, just click the *vote*-button to tweet
    your vote:

    .. image:: voting-nominee.png
       :width: 800

    .. code:: robotframework

       *** Settings ***

       Library  Selenium2Library
       Library  Selenium2Screenshots

       Suite Teardown  Close all browsers

       *** Test Cases ***

       Open Plone Awards
           Open browser  http://ploneawards.com
           Set window size   1024  768

       Show how to browse
           ${note} =  Add pointy note  css=#carousel a.next.browse
           ...  Click here to browse through the nominees
           ...  position=left
           Capture and crop page screenshot  choosing-nominee.png
           ...  css=#carousel  ${note}
           Remove elements  ${note}

       Tag a nominee
           Page should contain element  xpath=//a[contains(@href, 'robots')]
           Assign id to element
           ...  xpath=//a[contains(@href, 'robots')]/ancestor::div[@class='awardinfo']
           ...  chosen-nominee

       Choose a Plone Award nominee
           Wait until keyword succeeds
           ...  60s  2s
           ...  Chosen nominee should be visible

       Show how to vote
           ${note} =  Add pointy note  css=#chosen-nominee .votebutton
           ...  Click here to vote
           ...  position=bottom
           Capture and crop page screenshot  voting-nominee.png
           ...  css=#carousel  ${note}

       *** Keywords ***

       Chosen nominee should be visible
           ${invisible} =  Run keyword and return status
           ...  Element should not be visible  chosen-nominee
           Run keyword if  ${invisible}
           ...  Click link  css=#carousel a.next.browse
           Wait until element is visible  chosen-nominee  1s
    ```

6.  Build the documentation:

    ```shell
    $ sphinx-build source build
    ```

7.  Wait for a while by watching something like this:

    ```shell
    Making output directory...
    Running Sphinx v1.2b2
    loading pickled environment... not yet created
    No builder selected, using default: html
    building [html]: targets for 1 source files that are out of date
    updating environment: 1 added, 0 changed, 0 removed
    reading sources... [100%] index
    .../source/index.rst:None: WARNING: image file not readable: choosing-nominee.png
    .../source/index.rst:None: WARNING: image file not readable: voting-nominee.png
    looking for now-outdated files... none found
    pickling environment... done
    checking consistency... done
    preparing documents... done
    ========================================================================
    tmpl4e3nU
    ========================================================================
    Open Plone Awards                                               | PASS |
    ------------------------------------------------------------------------
    Show how to browse                                              | PASS |
    ------------------------------------------------------------------------
    Tag a nominee                                                   | PASS |
    ------------------------------------------------------------------------
    Choose a Plone Award nominee                                    | PASS |
    ------------------------------------------------------------------------
    Show how to vote                                                | PASS |
    ------------------------------------------------------------------------
    tmpl4e3nU                                                       | PASS |
    5 critical tests, 5 passed, 0 failed
    5 tests total, 5 passed, 0 failed
    ========================================================================
    Output:  None

    writing additional files... genindex search
    copying images... [100%] choosing-nominee.png
    copying static files... done
    copying extra files... dumping search index... done
    dumping object inventory... done
    build succeeded, 2 warnings.
    ```

8.  See the results in `./build/index.html`, just like in this video:

    <p style="text-align: center;"><iframe width="420" height="315" src="http://www.youtube.com/embed/1ZPZnwANx8I" frameborder="0" allowfullscreen></iframe></p>

Of course, it would be nice to do the same continuously with a code in
development in a sandboxed environment. Luckily, with Plone, that\'s
trivial with
[plone.app.robotframework](http://pypi.python.org/pypi/plone.app.robotframework).

Generating screenshots for a Plone add-on
-----------------------------------------

1.  As always, we need a `bootstrap.py`:

    ```shell
    $ curl -O http://downloads.buildout.org/2/bootstrap.py
    ```

2.  And `buildout.cfg`:

    ```properties
    [buildout]
    extends = http://dist.plone.org/release/4.3-latest/versions.cfg
    versions = versions
    parts = sphinx-build

    [sphinx-build]
    recipe = zc.recipe.egg
    eggs =
        Sphinx
        collective.cover[test]
        sphinxcontrib-robotframework[docs]
        plone.app.robotframework
    scripts = sphinx-build

    [versions]
    collective.cover = 1.0a4
    selenium = 2.35.0
    robotframework-selenium2library = 1.4.0
    # These versions are from collective.cover/versions.cfg
    plone.app.blocks = 1.1.1
    plone.app.drafts = 1.0a2
    plone.app.jquery = 1.7.2
    plone.app.jquerytools = 1.5.5
    plone.app.tiles = 1.0.1
    plone.tiles = 1.2
    ```

3.  Run the buildout:

    ```shell
    $ python bootstrap.py
    $ bin/buildout
    ```

4.  Create a source directory for you documentation:

    ```shell
    $ mkdir source
    ```

5.  Create a minimal Sphinx-configuration with our plugin enabled by
    creating a file `./source/conf.py`:

    ```python
    extensions = ['sphinxcontrib_robotframework']
    master_doc = 'index'
    ```

6.  Add the following `./source/index.rst`:

    ```restructuredtext
    My first cover page
    ===================

    This tutorial will show, how to create your first cover page.

    .. code:: robotframework
       :class: hidden

       *** Settings ***

       Resource  plone/app/robotframework/server.robot

       Library  Selenium2Screenshots

       Suite Setup  Setup Plone site with Cover
       Suite Teardown  Run keywords  Teardown Plone site  Close all browsers

       *** Keywords ***

       Setup Plone site with Cover
           Setup Plone site  collective.cover.testing.FUNCTIONAL_TESTING
           ...  plone.app.robotframework.testing.AUTOLOGIN_LIBRARY_FIXTURE
           Import library  Remote  ${PLONE_URL}/RobotRemote

           Enable autologin as  Site Administrator
           Set autologin username  test-user-1

           Set window size  1024  768

    At first, open the *Add new...*-menu and select *Cover*:

    .. image:: add-menu-cover.png

    .. code:: robotframework
       :class: hidden

       *** Test Cases ***

       Open the Plone site
           Go to  ${PLONE_URL}

       Open the Add new menu
           Click link  css=#plone-contentmenu-factories dt a
           Element should be visible
           ...  css=#plone-contentmenu-factories dd.actionMenuContent

       Show how to add a new cover
           ${note1}  Add pointy note  plone-contentmenu-factories
           ...  Click here to open the menu
           ...  position=top
           ${note2}  Add pointy note  collective-cover-content
           ...  Click here to add a new Cover-page
           ...  position=left
           Capture and crop page screenshot  add-menu-cover.png
           ...  css=#plone-contentmenu-factories .actionMenuContent
           ...  ${note1}  ${note2}

    Next, you should see a form like this:

    .. image:: add-form-cover.png

    .. code:: robotframework
       :class: hidden

       *** Test Cases ***

       Add a new Cover page
           Click link  collective-cover-content
           Page should contain element  form-widgets-IBasic-title

       Show how to fill the form
           Set window size  640  768
           ${note1}  Add note  form-widgets-IBasic-title
           ...  For a front-page, enter the title of your site here
           ...  width=400
           ${note2}  Add note  form-widgets-IBasic-description
           ...  For a front-page, enter the description for your site here
           ...  width=400
           ${note3}  Add pointy note  form-widgets-template_layout
           ...  Select a layout to start with
           ...  position=bottom
           ${note4}  Add note  canvas-layout
           ...  A preview of the selected layout will be updated here
           ${note5}  Add pointy note  form-buttons-save
           ...  Finally, click save
           ...  position=right
           Capture and crop page screenshot  add-form-cover.png
           ...  content  ${note1}  ${note2}  ${note3}  ${note4}  ${note 5}
    ```

7.  Build the documentation:

    ```shell
    $ sphinx-build source build
    ```

    <p style="text-align: center;"><iframe width="420" height="315" src="http://www.youtube.com/embed/87G4QiIqQCY" frameborder="0" allowfullscreen></iframe></p>

P.S. Robot Framework 2.8.3 should include our GSOC code to support
executing this kind of documentation normally as Robot Framework test
suite.
