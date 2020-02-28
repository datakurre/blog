---
title: Creating Plone content with Transmogrifier on Python 3
date: "2020-02-25T12:00:00Z"
tags: ["plone", "python3", "transmogrifier", "api"]
---

TL;DR; This blog post ends with minimal example of creating Plone 5.2 content with
Python 3 compatible Transmogrifier pipeline with command line execution.

Years ago, I forked the famous Plone content migration tool [Transmogrifier](https://pypi.org/project/collective.transmogrifier/) into a Plone independent and Python 3 compatible version, but [never released the fork to avoid maintenance burden](https://github.com/collective/transmogrifier/). Unfortunately, I was informed that [my old examples of using my transmogrifier fork with Plone](../../../2014/11/transmogrifier-python-migration.html/) no longer worked, so I had to review the situation.

The resolution: I found that I had changed some of the built-in reusable blueprints after the post, [I updated the old post](../../../2014/11/transmogrifier-python-migration.html/), fixed a compatibility issue related to updates in Zope Component Architecture dependencies, and tested the results with the latest Plone 5.2 on Python 3.

So, here goes a minimal example for creating Plone 5.2 content with Python 3 Transmogrifier pipeline using my fork:

At first `./buildout.cfg` for the Plone instance:

```properties
[buildout]
extends = http://dist.plone.org/release/5-latest/versions.cfg
parts = instance plonesite
versions = versions

extensions = mr.developer
sources = sources
auto-checkout = *

[sources]
transmogrifier = git https://github.com/collective/transmogrifier

[instance]
recipe = plone.recipe.zope2instance
eggs =
    Plone
    transmogrifier
user = admin:admin

[plonesite]
recipe = collective.recipe.plonesite
site-id = Plone
instance = instance
```

Then `buildout` must be run to create the instance with a Plone site:


```shell
$ buildout
```

Next the transmogrifier `./pipeline.cfg` must be created to define the pipeline:

```properties
[transmogrifier]
pipeline =
    from_rss
    prepare
    create
    patch
    commit

[from_rss]
blueprint = transmogrifier.from
modules = feedparser
expression = python:modules['feedparser'].parse(options['url']).get('entries', [])
url = http://rss.slashdot.org/Slashdot/slashdot

[prepare]
blueprint = transmogrifier.set
portal_type = string:Document
id = python:None
text = path:item/summary
_container = python:context.get('slashdot') or modules['plone.api'].content.create(container=context, type='Folder', id='slashdot')

[create]
blueprint = transmogrifier.set
modules = plone.api
object = python:modules['plone.api'].content.create(container=item.pop('_container'), type='Document', **item)

[patch]
blueprint = transmogrifier.transform
modules = plone.app.textfield
patch = python:setattr(item['object'], 'text', modules['plone.app.textfield'].value.RichTextValue(item['object'].text, 'text/html', 'text/x-html-safe'))

[commit]
blueprint = transmogrifier.transform
modules = transaction
commit = modules['transaction'].commit()
```

Finally, the execution of transmogrifier with Plone site as its context (remember that this version of transmogrifier also works outside Plone ecosystem):

```shell
$ bin/instance -OPlone run bin/transmogrify pipeline.cfg --context=zope.component.hooks.getSite
```

This example should result with the latest Slashdot posts in a Plone site. And, because this example is not perfect, running this again would create duplicates.

If this post raised more questions than gave answers, please, feel free to ask more at: https://github.com/collective/transmogrifier/issues.
