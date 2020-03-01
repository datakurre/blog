---
title: Creating Plone content with Transmogrifier on Python 3
date: "2020-02-25T12:00:00Z"
tags: ["plone", "python3", "transmogrifier", "api"]
---

TL;DR; This blog post ends with minimal example of creating Plone 5.2 content with
Python 3 compatible Transmogrifier pipeline with command line execution.

Years ago, I forked the famous Plone content migration tool [Transmogrifier](https://pypi.org/project/collective.transmogrifier/) into a Plone independent and Python 3 compatible version, but [never released the fork to avoid maintenance burden](https://github.com/collective/transmogrifier/). Unfortunately, I was informed that [my old examples of using my transmogrifier fork with Plone](../../../2014/11/transmogrifier-python-migration.html/) no longer worked, so I had to review the situation.

The resolution: I found that I had changed some of the built-in reusable blueprints after the post, [I updated the old post](../../../2014/11/transmogrifier-python-migration.html/), fixed a compatibility issue related to updates in Zope Component Architecture dependencies, and tested the results with the latest Plone 5.2 on Python 3.


Transmogrifying RSS into Plone
------------------------------

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
blueprint = transmogrifier.finally
modules = transaction
commit = modules['transaction'].commit()
```

Finally, the execution of transmogrifier with Plone site as its context (remember that this version of transmogrifier also works outside Plone ecosystem, but for a convenience `transmogrify`-script also supports calling with `instance run`):

```shell
$ bin/instance -OPlone run bin/transmogrify pipeline.cfg --context=zope.component.hooks.getSite
```

This example should result with the latest Slashdot posts in a Plone site. And, because this example is not perfect, running this again would create duplicates.


Transmogrifying JSON files into Plone
-------------------------------------

There's never enough simple tutorials on how to build your own Transmogrifier pipelines from scratch. Especially now, when many old pipeline packages have not been ported to Python 3 yet.

In this example we configure a buildout with local custom Transmogrifier blueprints in python and use them to do minimal import from a JSON export generated using [collective.jsonify](https://pypi.org/project/collective.jsonify/), which is a one of many legacy ways to generate intermediate export. (That said, it might be good to know, that nowadays [trivial migrations could be done with just Plone REST API and a little shell scripting](https://github.com/collective/gatsby-source-plone/tree/master/demo/fixture).)

At first, we will define a `./buildout.cfg` that expects a local directory `./local` to contain a Python module `./local/custom` and include ZCML configuration from `./local/custom/configure.zcml`:

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
    plone.restapi
user = admin:admin
extra-paths = local
zcml = custom

[plonesite]
recipe = collective.recipe.plonesite
site-id = Plone
instance = instance
```

Before running `buildout` we ensure a proper local Python module structure with:

```shell
$ mkdir -p local/custom
$ touch local/custom/__init__.py
$ echo '<configure xmlns="http://namespaces.zope.org/zope" />' > local/custom/__init__.py
```

Only then we run buildout as usually:

```shell
$ buildout
```

Now, let's populate our custom module with a Python module `./local/custom/blueprints.py` defining a couple of custom blueprints:

```python
# -*- coding: utf-8 -*-
from transmogrifier.blueprints import Blueprint

import json
import pathlib


class Glob(Blueprint):
    """Produce JSON items from files matching globbing from option `glob`."""
    def __iter__(self):
        for item in self.previous:
            yield item
        for p in pathlib.Path(".").glob(self.options["glob"]):
            with open(p, encoding="utf-8") as fp:
                yield json.load(fp)


class Folders(Blueprint):
    """Minimal Folder item producer to ensure that items have containers."""
    def __iter__(self):
        context = self.transmogrifier.context
        for item in self.previous:
            parts = (item.get('_path') or '').strip('/').split('/')[:-1]
            path = ''
            for part in parts:
                path += '/' + part
                try:
                    context.restrictedTraverse(path)
                except KeyError:
                    yield {
                        "_path": path,
                        "_type": "Folder",
                        "id": part
                    }
            yield item
```

And complete ZCML configuration at `./local/custom/configure.zcml` with matching blueprint registrations:

```xml
<configure
    xmlns="http://namespaces.zope.org/zope"
    xmlns:transmogrifier="http://namespaces.plone.org/transmogrifier">

  <include package="transmogrifier" file="meta.zcml" />

  <transmogrifier:blueprint
      component=".blueprints.Glob"
      name="custom.glob"
      />

  <transmogrifier:blueprint
      component=".blueprints.Folders"
      name="custom.folders"
      />

</configure>
```

Now, by using these two new blueprints and minimal content creating pipeline parts based on [built-in expression blueprints](https://github.com/collective/transmogrifier/tree/master/docs/blueprints), it is possible to:

* generate new pipeline items from exported JSON files
* inject folder items into pipeline to ensure that containers are created before items (because we cannot quarentee any order from the export)
* create minimal Folder and Document objects with plone.api.

```properties
[transmogrifier]
pipeline =
    generate_from_json
    generate_containers
    set_container
    create_folder
    create_document
    commit

[generate_from_json]
blueprint = custom.glob
glob = data/**/*.json

[generate_containers]
blueprint = custom.folders

[set_container]
blueprint = transmogrifier.set
_container = python:context.restrictedTraverse(item["_path"].rsplit("/", 1)[0])

[create_folder]
blueprint = transmogrifier.set
condition = python:item.get("_type") == "Folder"
modules = plone.api
_object = python:modules["plone.api"].content.get(item["_path"]) or modules["plone.api"].content.create(container=item["_container"], type="Folder", id=item["id"])

[create_document]
blueprint = transmogrifier.set
condition = python:item.get("_type") == "Document"
modules =
  plone.api
  plone.app.textfield
_object = python:modules["plone.api"].content.get(item["_path"]) or modules["plone.api"].content.create(container=item["_container"], type="Document", id=item["id"], title=item["title"], text=modules['plone.app.textfield'].value.RichTextValue(item["text"], 'text/html', 'text/x-html-safe'))

[commit]
blueprint = transmogrifier.finally
modules = transaction
commit = modules['transaction'].commit()
```

Finally, the pipeline can be run and content imported with:

```shell
$ bin/instance -OPlone run bin/transmogrify pipeline.cfg --context=zope.component.hooks.getSite
```

Obviously, in a real migration, the pipeline parts `[create_folder]` and `[create_document]` should be implemented in Python to properly populate all metadata fields, handle possible exceptions, etc, but consider that as homework.

---

If this post raised more questions than gave answers, please, feel free to ask more at: https://github.com/collective/transmogrifier/issues.
