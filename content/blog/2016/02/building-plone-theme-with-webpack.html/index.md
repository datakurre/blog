---
title: Building Plone theme with Webpack
date: "2016-02-15T06:00:00Z"
tags: ["Plone", "Theming", "Webpack"]
---

I just fixed my old post on [customizing Plone 5 default theme on the
fly](http://datakurre.pandala.org/2015/05/customize-plone-5-default-theme-on-fly.html)
to work with the final Plone 5.0 release.

But if you could not care less about TTW (through-the-web) theme
development, here\'s something for you too: it is possible to build a
theme for Plone 5 with all Plone 5\'s stylesheets and javascripts using
[Webpack](https://webpack.github.io/) -- the current tool of choice for
bundling web app frontent resources.

With Webpack, you can completely ignore Plone 5\'s TTW resource
registry, and build your own optimal CSS and JS bundles with all the
mockup patterns and other JS frameworks you need - with live preview
during development.

To try it out, take a look at my WIP example theme at:
<https://github.com/datakurre/plonetheme.webpack>

**Pros:**

-   Ship your theme with Webpack-optimized resource chunks automatically
    split into synchronous and asynchronously required resources.
-   Get faster-than-reload live previews of your changes during
    development thanks to Webpack\'s development server\'s hot module
    replacement support.
-   Get complete control of Plone 5 frontend resources and completely
    bypass Plone 5 TTW resource registry (it\'s awesome for TTW
    workflow, but not optimal for thefilesystem one).
-   Use the latest JS development tools (Webpack integrates nicely with
    Babel, ESLint and others) without need for legacy Bower, Grunt, Gulp
    or RequireJS.

**Cons:**

-   Installing a new Plone add-on requires configuring and building
    add-on\'s resources into theme.
-   You are on your own now, because you no longer get JS / CSS updates
    with new Python package releases, but you always need to also
    re-build your theme.
