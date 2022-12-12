---
title: Cross-browser test your Plone add-on with Robot Framework, Travis-CI and Sauce Labs
date: "2013-03-12T06:00:00Z"
tags: ["Plone", "Robot Framework", "Sauce Labs", "Selenium", "Testing", "Travis CI"]
---

Thanks to [Rok Garbas](http://garbas.si/), I became aware of [Sauce
Labs](http://saucelabs.com) during the [Plone testing
sprint](http://www.coactivate.org/projects/barcelona-sprint/project-home).

Finally, I had some time to try it myself, and I managed to make it work
pretty well with Robot Framework and Travis-CI:
[![travis](https://secure.travis-ci.org/datakurre/example.product.png)](http://travis-ci.org/datakurre/example.product)
[![saucelabs](https://saucelabs.com/buildstatus/exampleproduct)](https://saucelabs.com/u/exampleproduct)

I try to start from the very beginning, but if you already have Robot
Framework tests, or even Travis-CI-integration, you could just skip
these initial steps.

Bootstrap Templer
-----------------

Create buildout directory for Templer installation:

```shell
$ mkdir templer-buildout
$ cd templer-buildout/
```

Get `bootstrap.py`:

```shell
$ curl -o http://downloads.buildout.org/2/bootstrap.py
```

Create `buildout.cfg`:

```properties
[buildout]
parts = templer

[templer]
recipe = zc.recipe.egg
eggs =
    templer.core
    templer.plone
```

Run bootstrap and buildout to install Templer:

```shell
$ python bootstrap.py
$ bin/buildout
```

Create a new product with Templer
---------------------------------

Call the buildout-installed to create a new product with Robot Framework
test example:

```shell
$ templer-buildout/bin/templer plone_basic example.product
```

Be careful to answer `true` for the following question about including
Robot test templates:

```
robot tests (should the default robot test be included) [false]: true
```

Run buildout:

```shell
$ cd example.product
$ python bootstrap.py --distribute
$ bin/buildout
```

Update Robot Framework tests to be Selenium grid ready
------------------------------------------------------

Using Sauce Labs with Robot Framework (Selenium library) is similar to
using robot with your own selenium grid. It mainly requires making the
browser opening keyword configurable with a few selected variables.

Update `src/example/product/tests/robot_test.txt` with:

```robotframework
*** Settings ***

Library  Selenium2Library  timeout=10  implicit_wait=0.5

Suite Setup  Start browser
Suite Teardown  Close All Browsers

*** Variables ***

${ZOPE_HOST}  localhost
${ZOPE_PORT}  55001
${ZOPE_URL}  http://${ZOPE_HOST}:${ZOPE_PORT}

${PLONE_SITE_ID}  plone
${PLONE_URL}  ${ZOPE_URL}/${PLONE_SITE_ID}

${BROWSER}  Firefox
${REMOTE_URL}
${DESIRED_CAPABILITIES}  platform:Linux
${BUILD_NUMBER}  manual

*** Test Cases ***

Plone site
    [Tags]  start
    Go to  ${PLONE_URL}
    Page should contain  Plone site

*** Keywords ***

Start browser
    ${BUILD_INFO} =  Set variable
    ...           build:${BUILD_NUMBER},name:${SUITE_NAME} | ${TEST_NAME}
    Open browser  ${PLONE_URL}  ${BROWSER}
    ...           remote_url=${REMOTE_URL}
    ...           desired_capabilities=${DESIRED_CAPABILITIES},${BUILD_INFO}
```

Let me explain what all those variables are about:

-   **ZOPE\_HOST** should match the host for which ZServer is started
    during the test setup (ZServer host is configured with
    **ZSERVER\_HOST**-environment variable. It defaults to
    **localhost**.
-   **ZOPE\_PORT** should match the port number which ZServer is started
    to listen during the test setup (ZServer pot is configured with
    **ZSERVER\_PORT**-environment variable. It defaults to 55001, but we
    reconfigure it later by environment variables with one of the ports
    currently supported by Sauce Labs.
-   **ZOPE\_URL** is a convenience variable for accessing Zope
    application root.
-   **PLONE\_SITE\_ID** is the Plone portal object id (and path name)
    for the test site. It default to **plone**, but it can be configured
    with **PLONE\_SITE\_ID**-environment variable. The default should be
    ok for most cases.
-   **PLONE\_URL** is a convenience variable for accessing the Plone
    site front-page.
-   **BROWSER** selects the browser to run the tests with. The supported
    values depend on Selenium Python-package and can also be read from
    the documentation of **Open browser**-keyword in [Selenium2Library
    keywords](http://rtomac.github.com/robotframework-selenium2library/doc/Selenium2Library.html)
    documentation.
-   **REMOTE\_URL** enables testing with Selenium grid by defining the
    url of the Selenium hub to use.
-   **DESIRED\_CAPABILITIES** is used to pass various extra parameters
    for Selenium hub (e.g. the browser version to use or test metadata).
-   **BUILD\_NUMBER** is used to identify the Travis-CI build on **Sauce
    Labs**.

When robot tests for Plone are run using `bin/test`, all the variables
above can be overridden by defining corresponding **ROBOT\_**-prefixed
environment variable (e.g. **ROBOT\_REMOTE\_URL**).

Add Travis-CI configuration with Sauce Labs -support
----------------------------------------------------

There are a few steps in adding Travis-CI-support into your product.

At first, create `travis.cfg` to do the required magic for minimizing
buildout-time and setting a few required environment variables. Thanks
to the great community, we can just extend a public template:

```properties
[buildout]
extends =
    https://raw.github.com/collective/buildout.plonetest/master/travis-4.x.cfg

package-name = example.product
package-extras = [test]

allow-hosts +=
    code.google.com
    robotframework.googlecode.com

[versions]
plone.app.testing = 4.2.2

[environment]
ZSERVER_PORT= 8080
ROBOT_ZOPE_PORT= 8080

[test]
environment = environment
```

Create `.travis.yml` for letting Travis-CI to know how the environment
should be set up and the tests run:

```yaml
---
language: python
python: '2.7'
install:
- mkdir -p buildout-cache/downloads
- python bootstrap.py -c travis.cfg
- bin/buildout -N -t 3 -c travis.cfg
- curl -O http://saucelabs.com/downloads/Sauce-Connect-latest.zip
- unzip Sauce-Connect-latest.zip
- java -jar Sauce-Connect.jar $SAUCE_USERNAME $SAUCE_ACCESS_KEY -i $TRAVIS_JOB_ID
  -f CONNECTED &
- JAVA_PID=$!
before_script:
- bash -c "while [ ! -f CONNECTED ]; do sleep 2; done"
script: bin/test
after_script:
- kill $JAVA_PID
env:
  global:
  - ROBOT_BUILD_NUMBER=travis-$TRAVIS_BUILD_NUMBER
  - ROBOT_REMOTE_URL=http://$SAUCE_USERNAME:$SAUCE_ACCESS_KEY@ondemand.saucelabs.com:80/wd/hub
  matrix:
  - ROBOT_BROWSER=firefox ROBOT_DESIRED_CAPABILITIES=tunnel-identifier:$TRAVIS_JOB_ID
  - ROBOT_BROWSER=ie ROBOT_DESIRED_CAPABILITIES=tunnel-identifier:$TRAVIS_JOB_ID
  - ROBOT_DESIRED_CAPABILITIES="platform:OS X 10.8,browserName:iPad,version:6,tunnel-identifier:$TRAVIS_JOB_ID"
```

Let me describe:

1.  Lines 4-7: Run buildout.
2.  Lines 8-14: Download and start Sauce Connect.
3.  Line 15: Run tests.
4.  Lines 16-17: Shutdown Sauce Connect.
5.  Lines 18-21: Define required environment variables for letting robot
    to use Sauce Labs.
6.  Lines 22-25: Define build matrix for running the tests with Sauce
    Labs\' default Firefox, Internet Explorer and Mobile Safari.
    **tunnel-identifier**-stuff is required for Sauce Labs to allow more
    than one simultaneous tunnels for the same user account.

Next, define your Sauce Labs username and access key as secret,
encrypted, environment variables **SAUCE\_USERNAME** and
**SAUCE\_ACCESS\_KEY**.

Currently, Sauce Labs offers unlimited free subscription with three
simultaneous connections (e.g. running tests for three different
browsers at the same time) for Open Source projects. Just make sure to
register the account for your project, not yourself. Public repository
url is required for the creating the account and it cannot be changed
afterwards.

1.  Install Travis gem for Ruby (and install Ruby before that when
    required):

    ```shell
    $ gem install travis  # or sudo gem ...
    ```

2.  use **travis**-command to insert encrypted environment variables
    into the product\'s `.travis.yml`:

    ```shell
    $ travis encrypt SAUCE_USERNAME=myusername -r mygithubname/example.product --add env.global
    $ travis encrypt SAUCE_ACCESS_KEY=myaccesskey -r mygithubname/example.product --add env.global
    ```

Make sure to use your own Sauce Labs username and access key, and your
product\'s Github-repository path (with format username/repo).

Finally, enable Travis-CI-tests for you product either at
[Travis-CI.org](travis-ci.org) or at [GitHub](github.com).

Done. If I forgot something, I\'ll update this post.

Behind the basics: Test level status reporting for Sauce Labs
-------------------------------------------------------------

By default, Sauce Labs doesn\'t really know did the Selenium tests on it
pass or fail. To pass that information from our test runner on Travis-CI
to Sauce Labs, we need to add some extra code into our test setup.

At first, append the following into the end of
`src/example/product/testing.py`:

```python
import re
import os
import httplib
import base64
try:
    import json
    assert json  # pyflakes
except ImportError:
    import simplejson as json

from robot.libraries.BuiltIn import BuiltIn

USERNAME_ACCESS_KEY = re.compile('^(http|https):\/\/([^:]+):([^@]+)@')


class Keywords:
    def report_sauce_status(self, status, tags=[], remote_url=''):
        job_id = BuiltIn().get_library_instance(
            'Selenium2Library')._current_browser().session_id

        if USERNAME_ACCESS_KEY.match(remote_url):
            username, access_key =\
                USERNAME_ACCESS_KEY.findall(remote_url)[0][1:]
        else:
            username = os.environ.get('SAUCE_USERNAME')
            access_key = os.environ.get('SAUCE_ACCESS_KEY')

        if not job_id:
            return u"No Sauce job id found. Skipping..."
        elif not username or not access_key:
            return u"No Sauce environment variables found. Skipping..."

        token = base64.encodestring('%s:%s' % (username, access_key))[:-1]
        body = json.dumps({'passed': status == 'PASS',
                           'tags': tags})

        connection = httplib.HTTPConnection('saucelabs.com')
        connection.request('PUT', '/rest/v1/%s/jobs/%s' % (
            username, job_id), body,
            headers={'Authorization': 'Basic %s' % token}
        )
        return connection.getresponse().status
```

This code defines a custom Robot Framework keyword library with a
keyword for passing the test status (and other information) back to
Sauce Labs.

Next, we update `src/example/product/tests/robot_test.txt` to store the
session id during the setup of every test and send the test result back
to Sauce Labs during the teardown of every test:

```robotframework
*** Settings ***

Library  Selenium2Library  timeout=10  implicit_wait=0.5
Library  example.product.testing.Keywords

Test Setup  Start browser
Test Teardown  Run keywords  Report test status  Close All Browsers

*** Variables ***

${ZOPE_HOST} =  localhost
${ZOPE_PORT} =  55001
${ZOPE_URL} =  http://${ZOPE_HOST}:${ZOPE_PORT}

${PLONE_SITE_ID} =  plone
${PLONE_URL} =  ${ZOPE_URL}/${PLONE_SITE_ID}

${BROWSER} =  Firefox
${REMOTE_URL} =
${DESIRED_CAPABILITIES} =  platform:Linux
${BUILD_NUMBER} =  manual

*** Test Cases ***

Plone site
    [Tags]  start
    Go to  ${PLONE_URL}
    Page should contain  Plone site

*** Keywords ***

Start browser
    ${BUILD_INFO} =  Set variable
    ...           build:${BUILD_NUMBER},name:${SUITE_NAME} | ${TEST_NAME}
    Open browser  ${PLONE_URL}  ${BROWSER}
    ...           remote_url=${REMOTE_URL}
    ...           desired_capabilities=${DESIRED_CAPABILITIES},${BUILD_INFO}

Report test status
    Report sauce status  ${TEST_STATUS}  ${TEST_TAGS}  ${REMOTE_URL}
```

Please, note how we had to replace suite setup and teardown with test
setup and teardown) to open a new Selenium session for every test.

This worked for me. I hope it works for you too.

**example.product** is available at:
<https://github.com/datakurre/example.product>
