---
title: On building fat themes for Plone
date: "2016-10-04T06:00:00Z"
tags: ["diazo", "plone", "requirejs", "theming", "ttw", "webpack"]
---

Could fat themes become the common ground between filesystem Plone
developers and through-the-web integrators?

[Plone](https://plone.org/) ships with a lot of bundled batteries for
building sophisticated content management solutions. Content types,
workflows, portlets and event based content rules can all be customized
just by using browser without writing a single line of new code. Yet,
bad early experiences from maintaining such *through-the-web*
implementations, have made it common to disregard that approach, and
prefer (more technical) file system based approach instead.

During the last few years, thanks to
[Diazo](http://docs.diazo.org/en/latest/) based [theming framework for
Plone](https://pypi.python.org/pypi/plone.app.theming), there has been a
slow renaissance of *through-the-web* customization of Plone. Besides
Diazo itself, the new theming framework introduced a clever new storage
layer, [plone.resource](https://pypi.python.org/pypi/plone.resource),
which supported both python packaged and through-the-web\* developed
themes. In addition, the new theming editor made it easy to export
*through-the-web* developed themes as re-usable zip packages.

Initially, I was hoping for some kind of new TTW add-on approach to
emerge on top *plone.resource*. Nowadays it\'s getting clear that we are
just going add more features into themes instead. Maybe it\'s better
that way.

By fat themes, I mean themes which do not only provide look, but also
some behavior for the site. Most of my such themes have provided all
customizable configuration for their sites. The main benefit has been
faster iterations, because I\'ve been able to deliver updates without
running buildout or restarting the site.

Obviously, configuring everything in theme is not yet possible with
vanilla Plone, but requires selected theming related add-ons and tools:

collective.themefragments
-------------------------

[collective.themefragments](https://pypi.python.org/pypi/collective.themefragments)
makes it possible to include Zope/Chameleon page template fragments in
your theme, and inject them into rendered content using
[Diazo](http://docs.diazo.org/en/latest/) rules. It was originally
proposed as a core feature for Plone theming (by Martin Aspeli), but
because it was rejected, I had to to release it as its own add-on. Later
I added support for restricted python scripts (callable from those
fragments) and a tile to make fragments addable into Plone Mosaic
layouts.

Use of themefragments requires the add-on to be available for Plone
(e.g. by adding it to eggs in buildout and running the buildout) and
writing fragment templates into fragments\* subdirectory of theme:

**./fragments/title.pt:**

```html
<html>
<title></title>
<body>
  <h1 tal:content="context/Title">Title</h1>
<body>
</html>
```

And injecting them in **./rules.xml**:

```xml
<replace css:theme="h1" css:content="h1" href="/@@theme-fragment/title" />
```

or:

```xml
<replace css:theme="h1">
  <xsl:copy-of select="document('@@theme-fragment/title',
                       $diazo-base-document)/html/body/*" />
</replace>
```

depending on the flavor of your Diazo rules.

It\'s good to know that rendering fragments and executing their scripts
rely on Zope 2 restricted python, and may cause unexpected
*Unauthorized* exceptions (because you write them as admin, but viewers
may be unauthenticated). More than once I\'ve needed to set the
verbose-security flag to figure out the real reason of causing a such
exception\...

rapido.plone
------------

[rapido.plone](https://pypi.python.org/pypi/rapido.plone) must be
mentioned, even I don\'t have it in production yet by myself. Rapido
goes beyond just customizing existing features of Plone by making it
possible to implement completely new interactive features purely in
theme. Rapido is the spiritual successor of
[Plomino](https://pypi.python.org/pypi/Products.CMFPlomino) and probably
the most powerful add-on out there when it comes to customizing Plone.

When compared to to themefragments, Rapido is more permissive in its
scripts (e.g. allows use of plone.api).It also provides its own fast
storage layer ([Souper](https://pypi.python.org/pypi/souper)) for
storing, indexing and accessing custom data.

collective.themesitesetup
-------------------------

[collective.themesitesetup](https://pypi.python.org/pypi/collective.themesitesetup)
has become my \"Swiss Army knife\" for configuring Plone sites from
theme. It\'s a theming plugin, which imports [Generic
Setup](https://pypi.python.org/pypi/Products.GenericSetup) steps
directly from theme, when the theme is being activated. It also includes
helper views for exporting the current exportable site configuration
into editable theme directories.

This is the theming add-on, which makes it possible to bundle custom
content types, workflows, portlets, content rule configurations,
registry configuration and other [Generic
Setup](https://pypi.python.org/pypi/Products.GenericSetup)-configurable
stuff in a theme.

Recently, I also added additional support for importing also translation
domains, XML schemas and custom permissions.

A theme manifest enabling the plugin (once the plugin is available for
Plone) could look like the:

**./manifest.cfg:**

```properties
...

[theme:genericsetup]
permissions =
    MyProject.AddBlogpost    MyProject: Add Blogpost
```

and the theme package might include files like:

```
./install/registry.xml
./install/rolemap.xml
./install/types/Blog.xml
./install/types.xml
./install/workflows/blog_workflow/definition.xml
./install/workflows/blog_workflow/scripts
./install/workflows/blog_workflow/scripts/addExpirationDate.py
./install/workflows.xml

./models/Blog.xml

./locales/manual.pot
./locales/myproject.pot
./locales/plone.pot
./locales/fi/LC_MESSAGES/myproject.po
./locales/fi/LC_MESSAGES/plone.po
```

collective.taxonomy
-------------------

[collective.taxonomy](https://pypi.python.org/pypi/collective.taxonomy)
is not really a theming plugin, but makes it possible to include large
named vocabularies with translations in a [Generic
Setup](https://pypi.python.org/pypi/Products.GenericSetup) profile. That
makes it a nice companion to
[collective.themesitesetup](https://pypi.python.org/pypi/collective.themesitesetup)
by keeping XML schemas clean from large vocabularies.

collective.dexteritytextindexer
-------------------------------

[collective.dexteritytextindexer](https://pypi.python.org/pypi/collective.dexteritytextindexer)
is also \"just\" a normal add-on, but because it adds searchable text
indexing support for custom fields of custom content types, it is a
mandatory add-on when theme contains new content types.

plonetheme.webpacktemplate
--------------------------

Of course, the core of any theme is still about CSS and JavaScript to
make the site frontend look and feel good. Since
[Mockup](http://plone.github.io/mockup/dev/) and Plone 5, we\'ve had
[RequireJS](http://requirejs.org/) based JavaScript modules and bundles
for Plone, and [LESS](http://lesscss.org/) based default theme,
[Barceloneta](https://github.com/plone/plonetheme.barceloneta) (with
also [SASS
version](https://github.com/plone/plonetheme.barceloneta/tree/less2sass)
available). Unfortunately, thanks to the ever-changing state of
JavaScript ecosystem, there\'s currently no single correct tool or
re-building and customizing these Plone frontend resource.

My current tool of choice for building frontend resources for a Plone
theme is [Webpack](https://webpack.github.io/), which (with help of my
[plugin](https://www.npmjs.com/package/plonetheme-webpack-plugin)) makes
it possible to bundle (almost) all frontend resources from Plone
resource registry into theme, and inject my customizations while doing
that. And with a single \"publicPath\", setting, the resulting theme
could load those bundles from a CDN.

Configuring [Webpack](https://webpack.github.io/) is not the easiest
thing to learn, and debugging possible bundle build issues could be even
harder. Yet, I\'ve tried to make it easy to try it out with
[plonetheme.webpacktemplate](https://github.com/ebrehault/plonetheme.webpacktemplate)
[mr.bob](https://pypi.python.org/pypi/mr.bob)-template.

plonetheme-upload
-----------------

It should be clear by now, that even my themes are compatible and
customizable with through-the-web\* approach, I still work on filesystem
with version control and traditional Plone add-on development toolchain
(I may even have automated acceptance tests for non-trivial theme
features). For a long time, I just configured a global
*plone.resource*-directory in buildout and rsync\'d theme updates to
servers. It was about time to automate that.

[plonetheme-upload](https://www.npmjs.com/package/plonetheme-upload) is
a npm installable NodeJS-package, which provides a simple command line
tool for uploading theme directory into Plone using *Upload Zip file*
feature of Plone Theme settings. Its usage is as simple as:

```shell
$ plonetheme-upload my-theme-dir http://my.plone.domain
```

Possibly the next version shoud include another CLI tool,
plonetheme-download\*, to help also *through-the-web* themers to keep
their themes under version control.
