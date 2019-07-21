---
title: Transmogrifier, the Python migration pipeline, also for Python 3
date: "2014-11-19T06:00:00Z"
tags: ["migration", "plone", "python", "transmogrifier"]
---

**TL;DR;** I forked
[collective.transmogrifier](https://pypi.python.org/pypi/collective.transmogrifier)
into just [transmogrifier](https://github.com/datakurre/transmogrifier)
(not yet released) to make its core usable without Plone dependencies,
use [Chameleon](https://pypi.python.org/pypi/Chameleon) for
TAL-expressions, installable with just `pip install` and compatible with
Python 3.

[Transmogrifier](https://pypi.python.org/pypi/collective.transmogrifier)
is one of the many great developer tools by the
[Plone](http://plone.org/) community. It\'s a generic pipeline tool for
data manipulation, configurable with plain text
[INI-files](http://en.wikipedia.org/wiki/INI_file), while new re-usable
pipeline section blueprints can be implemented and packaged in Python.
It could be used to process any number of things, but historically it\'s
been mainly developed and used as a pluggable way to import legacy
content into Plone.

A simple transmogrifier pipeline for dumping news from Slashdot to a CSV
file could look like:

```properties
[transmogrifier]
pipeline =
    from_rss
    to_csv

[from_rss]
blueprint = transmogrifier.from
modules = feedparser
expression = python:modules['feedparser'].parse(options['url']).get('entries', [])
url = http://rss.slashdot.org/slashdot/slashdot

[to_csv]
blueprint = transmogrifier.to_csv
fieldnames =
    title
    link
filename = slashdot.csv
```

Actually, in time of writing this, I\'ve yet to do any Plone migrations
using transmogrifier. But when we recently had a reasonable size
non-Plone migration task, I knew not to re-invent the wheel, but to
transmogrify it. And we succeeded. Transmogrifier pipeline helped us to
design the migration better, and splitting data processing into multiple
pipeline sections helped us to delegate the work between multiple
developers.

Unfortunately, currently
[collective.transmogrifier](https://pypi.python.org/pypi/collective.transmogrifier)
has unnecessary dependencies on
[CMFCore](https://pypi.python.org/pypi/Products.CMFCore), is not
installable without long known good set of versions and is missing any
built-int command-line interface. At first, I tried to do all the
necessary refactoring inside **collective.transmogrifier**, but
eventually a fork was required to make the transmogrifier core usable
outside Plone-environments, be compatible with Python 3 and to not break
any existing workflows depending on the old transmogrifier.

So, meet the new
[transmogrifier](https://github.com/datakurre/transmogrifier):

-   can be installed with `pip install` (although, not yet released at
    PyPI)
-   new [mr.migrator](https://pypi.python.org/pypi/mr.migrator) inspired
    command-line interface (see `transmogrif --help` for all the
    options)
-   new base classes for custom blueprints
    -   `transmogrifier.blueprints.Blueprint`
    -   `transmogrifier.blueprints.ConditionalBlueprint`
-   new ZCML-directives for registering blueprints and re-usable
    pipelines
    -   `<transmogrifier:blueprint component="" name="" />`
    -   `<transmogrifier:pipeline id="" name="" description="" configuration="" />`
-   uses [Chameleon](https://pypi.python.org/pypi/Chameleon) for
    TAL-expressions (e.g. in `ConditionalBlueprint`)
-   has only a few generic built-in blueprints
-   supports
    [z3c.autoinclude](https://pypi.python.org/pypi/z3c.autoinclude) for
    package *transmogrifier*
-   fully backwards compatible with blueprints for
    [collective.transmogrifier](https://pypi.python.org/pypi/collective.transmogrifier)
-   runs with Python \>= 2.6, including Python 3+

There\'s still much work to do before a real release (e.g. documenting
and testing the new CLI-script and new built-in blueprints), but let\'s
still see how it works already\...

P.S. Please, use a clean Python
[virtualenv](https://pypi.python.org/pypi/virtualenv) for these
examples.

Example pipeline
----------------

Let\'s start with an easy installation

```shell
$ pip install git+https://github.com/datakurre/transmogrifier
$ transmogrify --help
Usage: transmogrify <pipelines_and_overrides>...
                [--overrides=overrides.cfg>]
                [--include=package_or_module>...]
                [--include=package:filename>...]
                [--context=<package.module.factory>]
   transmogrify --list
                [--include=package_or_module>...]
   transmogrify --show=<pipeline>
                [--include=package_or_module>...]
```

and with example filesystem `pipeline.cfg`

```properties
[transmogrifier]
pipeline =
    from_rss
    to_csv

[from_rss]
blueprint = transmogrifier.from
modules = feedparser
expression = python:modules['feedparser'].parse(options['url']).get('entries', [])
url = http://rss.slashdot.org/slashdot/slashdot

[to_csv]
blueprint = transmogrifier.to_csv
fieldnames =
    title
    link
filename = slashdot.csv
```

and its dependencies

```shell
$ pip install feedparser
```

and the results

```shell
$ transmogrify pipeline.cfg
INFO:transmogrifier:CSVConstructor:to_csv wrote 25 items to /.../slashdot.csv
```

using, for example, Python 2.7 or Python 3.4.

Minimal migration project
-------------------------

Let\'s create an example migration project with custom blueprints using
Python 3. In addition to
[transmogrifier](https://github.com/datakurre/transmogrifier), we need
[venusianconfiguration](https://pypi.python.org/pypi/venusianconfiguration)
for easy blueprint registration and, of course, actual depedencies for
our blueprints:

```shell
$ pip install git+https://github.com/datakurre/transmogrifier
$ pip install git+https://github.com/datakurre/venusianconfiguration
$ pip install fake-factory
```

Now we can implement custom blueprints in, for example, `blueprints.py`

```python
from venusianconfiguration import configure

from transmogrifier.blueprints import Blueprint
from faker import Faker


@configure.transmogrifier.blueprint.component(name='faker_contacts')
class FakerContacts(Blueprint):
    def __iter__(self):
        for item in self.previous:
            yield item

        amount = int(self.options.get('amount', '0'))
        fake = Faker()

        for i in range(amount):
            yield {
                'name': fake.name(),
                'address': fake.address()
            }
```

and see them registered next to the built-in ones (or from the other
packages hooking into transmogrifier autoinclude entry-point):

```shell
$ transmogrify --list --include=blueprints

Available blueprints
--------------------
faker_contacts
...
```

Now, we can make an example `pipeline.cfg`

```properties
[transmogrifier]
pipeline =
    from_faker
    to_csv

[from_faker]
blueprint = faker_contacts
amount = 2

[to_csv]
blueprint = transmogrifier.to_csv
```

and enjoy the results

```shell
$ transmogrify pipeline.cfg to_csv:filename=- --include=blueprints
address,name
"534 Hintz Inlet Apt. 804
Schneiderchester, MI 55300",Dr. Garland Wyman
"44608 Volkman Islands
Maryleefurt, AK 42163",Mrs. Franc Price DVM
INFO:transmogrifier:CSVConstructor:to_csv saved 2 items to -
```

An alternative would be to just use the shipped
[mr.bob](https://pypi.python.org/pypi/mr.bob)-template\...

Migration project using the template
------------------------------------

The new [transmogrifier](https://github.com/datakurre/transmogrifier)
ships with an easy getting started template for your custom migration
project. To use the template, you need a Python environment with
[mr.bob](https://pypi.python.org/pypi/mr.bob) and the new
transmogrifier:

```shell
$ pip install mr.bob readline  # readline is an implicit mr.bob dependency
$ pip install git+https://github.com/datakurre/transmogrifier
```

Then you can create a new project directory with:

```shell
$ mrbob bobtemplates.transmogrifier:project
```

Once the new project directory is created, inside the directory, you can
install rest of the depdendencies and activate the project with:

```shell
$ pip install -r requirements.txt
$ python setup.py develop
```

Now transmogrify knows your project\'s custom blueprints and pipelines:

```shell
$ transmogrify --list

Available blueprints
--------------------
myprojectname.mock_contacts
...

Available pipelines
-------------------
myprojectname_example
    Example: Generates uppercase mock addresses
```

And the example pipeline can be executed with:

```shell
$ transmogrify myprojectname_example
name,address
ISSAC KOSS I,"PSC 8465, BOX 1625
APO AE 97751"
TESS FAHEY,"PSC 7387, BOX 3736
APO AP 13098-6260"
INFO:transmogrifier:CSVConstructor:to_csv wrote 2 items to -
```

Please, see created `README.rst` for how to edit the example blueprints
and pipelines and create more.

Mandatory example with Plone
----------------------------

Using the new
[transmogrifier](https://github.com/datakurre/transmogrifier) with Plone
should be as simply as adding it into your `buildout.cfg` next to the
old transmogrifier packages:

```properties
[buildout]
extends = http://dist.plone.org/release/4.3-latest/versions.cfg
parts = instance plonesite
versions = versions

extensions = mr.developer
soures = sources
auto-checkout = *

[sources]
transmogrifier = git https://github.com/datakurre/transmogrifier

[instance]
recipe = plone.recipe.zope2instance
eggs =
    Plone
    z3c.pt
    transmogrifier
    collective.transmogrifier
    plone.app.transmogrifier
user = admin:admin
zcml = plone.app.transmogrifier

[plonesite]
recipe = collective.recipe.plonesite
site-id = Plone
instance = instance

[versions]
setuptools =
zc.buildout =
```

Let\'s also write a fictional migration pipeline, which would create
Plone content from Slashdot RSS-feed:

```properties
[transmogrifier]
pipeline =
    from_rss
    id
    fields
    folders
    create
    update
    commit

[from_rss]
blueprint = transmogrifier.from
modules = feedparser
expression = python:modules['feedparser'].parse(options['url']).get('entries', [])
url = http://rss.slashdot.org/Slashdot/slashdot

[id]
blueprint = transmogrifier.set
modules = uuid
id = python:str(modules['uuid'].uuid4())

[fields]
blueprint = transmogrifier.set
portal_type = string:Document
text = path:item/summary
_path = string:slashdot/${item['id']}

[folders]
blueprint = collective.transmogrifier.sections.folders

[create]
blueprint = collective.transmogrifier.sections.constructor

[update]
blueprint = plone.app.transmogrifier.atschemaupdater

[commit]
blueprint = transmogrifier.to_expression
modules = transaction
expression = python:modules['transaction'].commit()
mode = items
```

Now, the new CLI-script can be used together with
`bin/instance -Ositeid run` provided by
[plone.recipe.zope2instance](https://pypi.python.org/pypi/plone.recipe.zope2instance)
so that transmogrifier will get your site as its context simply by
calling \`zope.component.hooks.getSite\`:

```shell
$ bin/instance -OPlone run bin/transmogrify pipeline.cfg --context=zope.component.hooks.getSite
```

With Plone you should, of course, still use Python 2.7.

Funnelweb example with Plone
----------------------------

[Funnelweb](https://pypi.org/project/funnelweb/) is a collection of transmogrifier blueprints an pipelines
for scraping any web site into Plone. I heard that its example pipelines
are a little outdated, but they make a nice demo anywyay.

Let\'s extend our previous Plone-example with the following
`funnelweb.cfg` buildout to include all the necessary transmogrifier
blueprints and the example `funnelweb.ttw` pipeline:

```properties
[buildout]
extends = buildout.cfg

[instance]
eggs +=
    transmogrify.pathsorter
    funnelweb
```

We also need a small additional pipeline `commit.cfg` to commit all the
changes made by `funnelweb.ttw`:

```properties
[transmogrifier]
pipeline = commit

[commit]
blueprint = transmogrifier.interval
modules = transaction
expression = python:modules['transaction'].commit()
```

Now, after the buildout has been run, the following command would use
pipelines `funnelweb.ttw` and `commit.cfg` to somewhat scrape my blog
into Plone:

```shell
$ bin/instance -OPlone run bin/transmogrify funnelweb.ttw commit.cfg crawler:url=http://datakurre.pandala.org "crawler:ignore=feeds\ncsi.js" --context=zope.component.hooks.getSite
```

For tuning the import further, the used pipelines could be easily
exported into filesystem, customized, and then executed similarly to
`commit.cfg`:

```shell
$ bin/instance -OPlone run bin/transmogrify --show=funnelweb.ttw > myfunnelweb.cfg
```
