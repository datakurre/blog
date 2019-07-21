---
title: Stay accessible – Robot Framework library for WAVE-toolbar
date: "2013-05-26T06:00:00Z"
tags: ["accessibility", "plone", "robot framework", "vagrant", "wave", "webaim"]
---

[WAVE Web Accessibility Tool](http://wave.webaim.org/) is a popular
service for detecting accessibility issues on your websites. [WAVE
Toolbar](http://wave.webaim.org/toolbar/) is an *offline* version of the
service, distributed as a downloadable, self-installable, Firefox
add-on. Both the service and the toolbar are produced and copyrighted by
[WebAIM](http://webaim.org/) a US based non-profit organization, but are
usable without cost.

During [the last
PLOG](http://www.abstract.it/en/abstract/initiative/plog-2013) I was
asked by [Paul](http://twitter.com/polyester), if it would be possible
to automate WAVE Toolbar -powered accessibility checks with [Robot
Framework](http://robotframework.org/) (and its
[Selenium-library](http://pypi.python.org/pypi/robotframework-selenium2library)).
Luckily, it seems to be:

<p style="text-align: center;"><iframe width="420" height="315" src="http://www.youtube.com/embed/wfNpwCTu_HI" frameborder="0" allowfullscreen></iframe></p>

robotframework-wavelibrary
--------------------------

**WAVELibrary** is a new Robot Framework library, packaged as
[robotframework-wavelibrary](http://pypi.python.org/pypi/robotframework-wavelibrary),
to provide keywords for executing WAVE Toolbar accessibility analysis
directly withing Robot Framework tests.

Together with the Selenium-library, it allows you to prepare any test
situation on your web product (e.g. login and open some form), execute
WAVE-analysis and either pass or fail the test according to the results.
And those tests can also be integrated with your CI to avoid
accidentally introducing new accessibility issues.

**WAVELibrary** is open source, so if its current features are not
enough, thanks to Robot Framework syntax, you can easily [contribute and
make it
better](http://github.com/datakurre/robotframework-wavelibrary/).

*(Please, note that you should not solely rely only on WAVE Toolbar for
validating your products accessibility, because accessibility should
always be verified by a human. Yet, WAVE Toolbar could assist you on
detecting possible accessibility issues, WAVELibrary could help in
automating that, and once you are accessible, WAVE Toolbar and
WAVELibrary together can help you to stay accessible.)*

Basic usage
-----------

### ./bootstrap.py

```shell
$ curl -O http://downloads.buildout.org/2/bootstrap.py
```

### ./buildout.cfg

```properties
[buildout]
parts = pybot

[pybot]
recipe = zc.recipe.egg
eggs =
     robotframework
     robotframework-wavelibrary
```

### ./example.robot

```robotframework
*** Settings ***

Library  WAVELibrary

Suite setup  Open WAVE browser
Suite teardown  Close all browsers

*** Test Cases ***

Test single page
    [Documentation]  Single page test could interact with the target
    ...              app as much as required and end with triggering
    ...              the accessibility scan.
    Go to  http://www.plone.org/
    Check accessibility errors

Test multiple pages
    [Documentation]  Template based test can, for example, take a list
    ...              of URLs and perform accessibility scan for all
    ...              of them. While regular test would stop for the
    ...              first failure, template based test will just jump
    ...              to the next URL (but all failures will be reported).
    [Template]  Check URL for accessibility errors
    http://www.plone.org/
    http://www.drupal.org/
    http://www.joomla.org/
    http://www.wordpress.org/
```

See also all [the available
keywords](http://robot-framework-wave-library.readthedocs.org/). (in
addition to [robot
keywords](http://robotframework.googlecode.com/hg/doc/libraries/BuiltIn.html?r=2.7.7)
and [selenium
keywords](http://rtomac.github.com/robotframework-selenium2library/doc/Selenium2Library.html)).

### Installing

```shell
$ python bootstrap.py
$ bin/buildout
```

### Running

```shell
$ bin/pybot example.robot

==============================================================================
Example
==============================================================================
Test single page :: Single page test could interact with the target   | PASS |
------------------------------------------------------------------------------
Test multiple pages :: Template based test can, for example, take ... | FAIL |
Wave reported errors for http://wordpress.org/: ERROR: Form label missing !=
------------------------------------------------------------------------------
Example                                                               | FAIL |
2 critical tests, 1 passed, 1 failed
2 tests total, 1 passed, 1 failed
==============================================================================
Output:  /.../output.xml
Log:     /.../log.html
Report:  /.../report.html
```

In addition to generated Robot Framework test report and log, there
should be WAVE Toolbar -annotated screenshot of each tested page and
WAVELibrary also tries to take a cropped screenshot of each visible
accessibility error found on the page.

Plone usage
-----------

While WAVELibrary has no dependencies on Plone, it\'s tailored to work
well with
[plone.app.robotframework](http://pypi.python.org/pypi/plone.app.robotframework)
so that it\'s easy to run accessibility test against sandboxed test
instance.

### ./bootstrap.py

```shell
$ curl -O http://downloads.buildout.org/2/bootstrap.py
```

### ./buildout.cfg

```properties
[buildout]
extends = http://dist.plone.org/release/4.3-latest/versions.cfg
parts = robot

[robot]
recipe = zc.recipe.egg
eggs =
     plone.app.robotframework
     robotframework-wavelibrary
```

### ./plone.robot

```robotframework
*** Settings ***

Library  WAVELibrary

Resource  plone/app/robotframework/server.robot

Suite Setup  Setup
Suite Teardown  Teardown

*** Variables ***

${START_URL}  about:

*** Keywords ***

Setup
    Setup Plone site  plone.app.robotframework.testing.AUTOLOGIN_ROBOT_TESTING
    Import library  Remote  ${PLONE_URL}/RobotRemote
    Enable autologin as  Site Administrator
    Set autologin username  test-user-1

Teardown
    Teardown Plone Site

*** Test Cases ***

Test Plone forms
    [Template]  Check URL for accessibility errors
    ${PLONE_URL}/@@search
    ${PLONE_URL}/folder_contents
    ${PLONE_URL}/@@personal-information
    ${PLONE_URL}/@@personal-preferences

Test new page form tabs
    [Template]  Check new page tabs for accessibility errors
    default
    categorization
    dates
    creators
    settings

*** Keywords ***

Check new page tabs for accessibility errors
    [Arguments]  ${fieldset}
    Go to  ${PLONE_URL}/createObject?type_name=Document
    ${location} =  Get location
    Go to  ${PLONE_URL}
    Go to  ${location}#fieldsetlegend-${fieldset}
    Check accessibility errors
```

### Installing

```shell
$ python bootstrap.py
$ bin/buildout
```

### Running

```shell
$ bin/pybot plone.robot
```

One more thing\...
------------------

What about recording those test runs?

1.  Get [VirtualBox](http://www.virtualbox.org) and
    [Vagrant](http://www.vagrantup.com).

2.  Get and build my [Robot Recorder
    kit](http://github.com/datakurre/robotrecorder_vagrant/):

    ```shell
    $ git clone git://github.com/datakurre/robotrecorder_vagrant.git
    $ cd robotrecorder_vagrant && vagrant up && cd ..
    ```

3.  Figure out your computer\'s local IP\...

4.  Record the previously described Plone-suite:

    ```shell
    $ ZSERVER_HOST=mycomputerip bin/pybot -v ZOPE_HOST:mycomputerip -v REMOTE_URL:http://localhost:4444/wd/hub plone.robot
    ```

The recording is saved in `./robotrecorder_vagrant/recordings`.
