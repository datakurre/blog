---
title: Running Robot Framework tests with Google App Engine SDK
description: For a long time I thought that Selenium was hard to set up and tests for it were hard to write. Well, I couldn't have been more wrong.
date: "2012-06-01T06:00:00Z"
tags: ["google app engine", "python", "robot framework", "selenium", "testing"]
---

For a long time I thought that Selenium was hard to set up and tests for
it were hard to write. Well, I couldn\'t have been more wrong. With
[Robot Framework](http://code.google.com/p/robotframework/) and
[robotframework-selenium2library](http://pypi.python.org/pypi/robotframework-selenium2library)
even a BDD-style acceptance test case using Selenium can be as simple
as:

```robotframework
*** Test Cases ***

Can upload file as an admin
    Given I'm logged in as an admin
     When I go to address '/upload'
      And I select the file 'hello.html' into the field 'file'
      And I click the button 'submit'
     Then the page should contain link 'hello.html'
```

Let\'s see, how that\'s possible for a GAE app\...

Bootstrap your development environment
--------------------------------------

I happen to like [buildout](http://buildout.org/) for keeping my
development environments for different projects clean, separated and
reproduceable. Today it helps us to install and create scripts for
running Robot Framework tests for our GAE app with all the required
dependencies. Buildout installs everything under your project directory,
so the process keeps your system Python clean and healthy.

0.  create a new project directory called `myapp` and go there

    ```shell
    $ mkdir myapp
    $ cd myapp
    ```

1.  create a new directory called `src`

    ```shell
    $ mkdir src
    ```

2.  copy the codebase of your GAE app into that directory

    ```shell
    $ cp -R /path/to/myapp src
    ```

3.  create a file called `setup.py` to allow Python
    [setuptools](http://pypi.python.org/pypi/setuptools) (or
    [distribute](http://pypi.python.org/pypi/distribute)) used by the
    buildout to find your code

    ```python
    from setuptools import setup, find_packages

    setup(
        name='myapp',
        packages=find_packages('src', exclude=['ez_setup']),
        package_dir={'': 'src'},
        include_package_data=True,
        zip_safe=False,
        install_requires=['setuptools'],
    )
    ```

4.  create a file called `MANIFEST.in` to accompany your `setup.py`

    ```python
    recursive-include src *.yaml *.py *.txt *.html *.css
    ```

5.  create a file called `buildout.cfg` to configure your buildout to
    download the SDK and create a Robot Framework test script with both
    SDK and your code registered into its run-time `sys.path`

    ```properties
    [buildout]
    parts =
        app
        test
    unzip = true
    develop = .

    [app]
    recipe = rod.recipe.appengine
    zip-packages = False
    exclude = tests
    url = http://googleappengine.googlecode.com/files/google_appengine_1.6.6.zip
    eggs = myapp

    [test]
    recipe = zc.recipe.egg
    eggs =
        robotframework
        robotentrypoints
        robotframework-selenium2library
        myapp
    extra-paths = ${buildout:parts-directory}/google_appengine
    ```

6.  download the `bootstrap.py` for bootstrapping your buildout

    ```shell
    $ wget http://svn.zope.org/*checkout*/zc.buildout/trunk/bootstrap/bootstrap.py
    ```

7.  finally, run the bootstrap and buildout

    ```shell
    $ python boostrap.py
    $ bin/buildout
    ```

If everything goes as planned, your project directory should now include
a script `bin/pybot` for running Robot Framework with all the
requirements in `sys.path`.

P.S. The above buildout provides also scripts `bin/app` and
`bin/appcfg`, which allow you to start the development server or upload
your app without system wide GAE SDK install. See
[rod.recipe.appengine](http://pypi.python.org/pypi/rod.recipe.appengine)
for details.

Setup your test fixture
-----------------------

For acceptance tests, it would be nice to have your GAE app running as
completely as possible, but with a clean database for every test. That
requires every test to have a setup method for launching your app onto
background before the test and a teardown method to shut it down after
the test.

Unfortunately, GAE SDK won\'t ship with much support for automated
acceptance test. There exists a project called
[gaedriver](http://code.google.com/p/gaedriver/wiki/PythonTutorial) for
running SDK\'s development server as a Python subprocess while running
the tests. Yet, because I was looking for something even simpler,
eventually I ended up with something my own.

1.  create a directory `src/tests` to contain your app\'s custom Robot
    Framework library and the acceptance tests

    ```shell
    $ mkdir src/tests
    ```

2.  create a file called `src/tests/__init__.txt` to define setup and
    teardown keywords for every Robot Framework test found under the
    same directory (or under its sub-directories)

    ```robotframework
    *** Settings ***

    Resource  common.txt

    Test Setup  Start app and open browser
    Test Teardown  Stop app and close all browsers
    ```

3.  create an another file called `src/tests/common.txt` to define the
    setup and teardown methods in detail and also the libraries
    including the used keywords

    ```robotframework
    *** Settings ***

    Library  Selenium2Library  timeout=5  implicit_wait=5
    Library  tests.AppEngineLibrary

    *** Keywords ***

    Start app and open browser
        Start app
        Open browser  http://localhost:8080/

    Stop app and close all browsers
        Close all browsers
        Stop app
    ```

4.  finally, create a file called `src/tests/__init__.py` to define our
    custom **AppEngineLibrary** to provide keywords for starting and
    stopping our app for every test case

    ```python
    # -*- coding: utf-8 -*-
    """Google App Engine library for Robot Framework"""

    import signal
    import os.path


    class AppEngineLibrary(object):
        """Provides keywords for starting and shutting down GAE dev_appserver"""

        def __init__(self):

            # initialize variables
            self.robot_pid = None
            self.gae_pid = None

        def start_application(self):

            # save the process id to distinguish it from its children
            self.robot_pid = os.getpid()

            # fork the process for its child to launch the appserver
            self.gae_pid = os.fork()

            if os.getpid() != self.robot_pid:
                # mute logging so that app server doesn't mess with the robot
                import logging
                logging.disable(logging.CRITICAL)

                # import appserver and fix sys.path for GAE modules only after
                # the process has been forked (GAE may monkeypatch things...)
                import dev_appserver
                dev_appserver.fix_sys_path()

                # launch the appserver
                from google.appengine.tools.dev_appserver_main import main
                app_dir = os.path.join(os.path.dirname(__file__), os.path.pardir)
                main([
                    os.getcwd(),
                    app_dir,
                    '--skip_sdk_update_check',
                    '--clear_datastore',
                ])

                # make immediate suicide as soon as the appserver has shut down
                os.kill(os.getpid(), signal.SIGKILL)

        def stop_application(self):

            # tell the appserver to terminate
            os.kill(self.gae_pid, signal.SIGTERM)

        start_app = start_application  # alias
        stop_app = stop_application  # alias
    ```

Now you should have everything ready and in place for writing acceptance
tests for you app.

Write and run your first test case
----------------------------------

Create a complete test case file called `src/tests/test_upload.txt`,
including a BDD-style test case and re-usable helper keywords to
translate BDD-clauses into more generic Robot Framework tests using the
keywords defined in Selenium2Libary

```robotframework
*** Settings ***

Resource  common.txt

*** Variables ***

${ADMIN_EMAIL}  admin@example.com

*** Test Cases ***

Can upload file as an admin
    Given I'm logged in as an admin
     When I go to address '/upload'
      And I select the file 'hello.html' into the field 'file'
      And I click the button 'submit'
     Then the page should contain link 'hello.html'

*** Keywords ***

I'm logged in as an admin
    Go to  http://localhost:8080/upload
    Click link  Login
    Input text  email  ${ADMIN_EMAIL}
    Click button  Login

I go to address '${path}'
    Go to  http://localhost:8080${path}

I select the file '${filename}' into the field '${locator}'
    Choose file  ${locator}  ${CURDIR}/${filename}

I click the button '${locator}'
    Click button  ${locator}

The page should contain link '${locator}'
    Page should contain link  ${locator}
```

Now this test could be executed with Robot Framework and Selenium just
by using the command

```shell
$ bin/pybot src/tests
```

Of course, you should look into [Robot Framework User
Guide](http://robotframework.googlecode.com/hg/doc/userguide/RobotFrameworkUserGuide.html?r=2.7.7#creating-test-cases).
