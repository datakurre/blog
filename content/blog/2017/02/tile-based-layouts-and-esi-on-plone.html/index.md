---
title: Tile based layouts and ESI on Plone
date: "2017-02-26T06:00:00Z"
tags: ["Blocks", "ESI", "Plone", "Tiles", "Varnish"]
---

Plone\'s [Blocks: Grid based
layouts](https://github.com/plone/plone.app.mosaic/raw/master/docs/Blocks.pdf) is an old manifest (originally dated back to 2008 or 2009)
about simplifying [Plone](https://www.plone.org/)\'s (ME)TAL-macros, content providers (portlets and viewlets)
based layout machinery with a composition of independently rendered
static HTML layouts and dynamic content tiles. The initial
implementation of the manifest was completed already by 2011 with the
first versions of
[plone.tiles](https://pypi.python.org/pypi/plone.tiles) and
[plone.app.blocks](https://pypi.python.org/pypi/plone.app.blocks). It was supposed to be a core part of Plone 5, but continues
to be delayed because the failure of the Plone Deco project. Sad.

Because of the separation of content and composition, the new approach
introduced new options for the actual page rendering process: It was no
longer necessary to render a complete Plone page at once, but each page
could be composed of multiple independently rendered and cached content
fragment. Of course, the complete rendering could still be done on Plone
at once like before, but it also became possible to compose the page
from its fragments with
[ESI](https://en.wikipedia.org/wiki/Edge_Side_Includes) (Edge Side Includes) in a compatible caching proxy, or with
JavaScript (e.g. with
[pat-inject](http://patternslib.com/inject/){.reference .external}) in
an end users browser. Both of these approaches providing parallel
rendering of page fragments, while each of those fragment could be
cached independently simply by using the standard HTTP caching headers.
Which is great.

So, what could all this mean in practice? Thanks to tile based layouts,
Varnish and ESI, we are now able to cache every cacheable part of our
pages also for logged-in users, resulting in noticeably better
performance and user experience.

(And yes, this approach may look already outdated, when compared various
front-end based composition options of headless CMS era, but still
solves real issues with the current Plone with server-rendered HTML.)

Blocks rendering process revisited
----------------------------------

To really understand the goals of tile based layouts, let\'s revisit the
once revolutionary page composition process implemented in
[plone.app.blocks](https://pypi.python.org/pypi/plone.app.blocks).

In the simplest form of rendering, a Plone page could still render a
complete HTML document as before:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Title</title>
</head>
<body>
  <!-- ... -->
</body>
</html>
```

But instead of always rendering everything, with tile based layouts it
become possible to speed up the main rendering of the page by delegating
the rendering of dynamic parts of the page to separate independent
renderers, called tiles:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Title</title>
</head>
<body>
  <!-- ... -->
  <div data-tile="TILE_URL" />
  <!-- ... -->
</body>
</html>
```

The page rendering output could include as many plaholder elements with
`data-tile`-attribute as required, and expect
something later to replace those elements with the contents defined by
their URL values. This *something* is still Plone by default, but it
could also be a middleware (like ESI in caching proxy) or JavaScript in
a browser.

The main benefits from decoupling rendering and composition like this
include (with either ESI or JavaScript -based composition) include:

1.  Experiential speed-up, because the main page may be already
    partially or completely visible in the browser while the delegated
    parts are still being rendered
2.  real speed-up, because the delegated parts may be rendered in
    parallel
3.  real speed-up, because the delegated parts may be cached separately
    with optimized HTTP caching headeaders.

It\'s crucial that the value of `data-tile`
attribute is full absolute or relative URL, and that the target address
can be rendered independently from the main page. These assumptions
would make the composition logically independent from then underlying
server technology. It\'s even possible to compose page from snippets
rendered by multiple different services.

In addition to the `data-tile`-composition,
[plone.app.blocks](https://pypi.python.org/pypi/plone.app.blocks) provides an additional composition to separate content area
page design (content layout) from its surroundings (site layout).

To use this additional site layout composition, a page rendering must
define the URL of the used site layout and the panels (slots) it fills
into that layout by using the additional data-attributes
`data-layout` and `data-panel`
as in the following example:

```html
<!DOCTYPE html>
<html>
<body data-layout="LAYOUT_URL">
  <div data-panel="PANEL_ID">
    <!-- ... -->
    <div data-tile="TILE_URL" />
    <!-- ... -->
  </div>
</body>
</html>
```

Together, these attributes instruct the composition as follows: Please,
load a site layout at `LAYOUT_URL` and render it
with its panel named `PANEL_ID` filled with
childrens of this tag.

So, if the site layout in question would look like:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Title</title>
</head>
<body>
  <!-- ... -->
  <div data-panel="PANEL_ID">
    <!-- ... -->
  </div>
  <!-- ... -->
</body>
</html>
```

The main rendering of the page would look like:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Title</title>
</head>
<body>
  <!-- ... -->
  <div>
    <!-- ... -->
    <div data-tile="TILE_URL" />
    <!-- ... -->
  </div>
  <!-- ... -->
</body>
</html>
```

Obviously, the site layout could define multiple panels, and the content
layout could fill anything from none to all of them.

Currently, this so called *panel merge* is always done by Plone with
transform code in
[plone.app.blocks](https://pypi.python.org/pypi/plone.app.blocks), but technically this could also be done e.g. in a WSGI
middleware, releasing Plone worker threads even more earlier than is
currently possible with just ESI or browser side composition of tiles.

Caching ESI tiles for logged-in users
-------------------------------------

[ESI](https://en.wikipedia.org/wiki/Edge_Side_Includes) (Edge Side Includes) is an old proposal (mainly by Akamai)
for an XML namespace to describe HTML page composition from multiple
separate resources. A quite minimal subset of the language is
implemented also in
[Varnish](https://varnish-cache.org/docs/4.1/users-guide/esi.html), a popular and recommended caching proxy also in Plone
setups.

Using and enabling ESI with
[plone.tiles](https://pypi.python.org/pypi/plone.tiles),
[plone.app.blocks](https://pypi.python.org/pypi/plone.app.blocks) and
[Varnish](https://varnish-cache.org/docs/4.1/users-guide/esi.html) is well documented in those packages\' READMEs. Yet,
something we discovered only very recently was, how to use ESI to safely
cache tiles for logged-in users.

Of course, by default, Plone never caches anything for logged-in-users.
At first,
[plone.app.caching](https://pypi.python.org/pypi/plone.app.caching) declares all responses private, unless they should be visible
for anonymous users. And then, the recommended Varnish configuration
skips caches whenever Plone session cookie is present in request. So, by
default, we are protected from both sides. (And that\'s great design to
protect us from our own mistakes!)

The first step to support caching for logged-in users is to allow
Varnish (in `default.vcl`) to do cache lookup for
ESI tiles:

```
sub vcl_recv {
  # ...
  if (req.esi_level > 0) {
      set req.http.X-Esi-Level = req.esi_level;
      return (hash);
  } else {
      unset req.http.X-Esi-Level;
  }
  # ....
```

Of course, this would allow lookup for only completely public tiles,
because only those could be cached by Varnish by default. That\'s why,
in the example above, we also manage a completely new header
`X-Esi-Level`, and we make sure it\'s only available
when Varnish is doing its internal subrequests for ESI-tiles.

With that extra header in place, we can instruct Varnish to hash
responses to ESI-subrequests separately from responses to main requests.
In other words, we split Varnish cache into public and private areas.
While public cache remains accessible for anyone knowning just the
cached URL, the private one is only accessible for Varnish itself, when
it\'s doing ESI subrequests:

```
sub vcl_hash {
    hash_data(req.url);
    if (req.http.host) {
        hash_data(req.http.host);
    } else {
        hash_data(server.ip);
    }
    if (req.http.X-Esi-Level) {
       hash_data(req.http.X-Esi-Level);
    }
    return (lookup);
}
```

Now we are almost ready to patch let Plone to allow caching of
restricted tiles. But only tiles. Because of `X-Esi-Level` would only be set for Varnish\'s internal subrequests for
tiles, all other requests would be handled as before. This patch is done
by monkeypatching an utility method in
[plone.app.caching](https://pypi.python.org/pypi/plone.app.caching) to allow public `Cache-Control`-header
for otherwise restricted tiles when the trusted `X-Esi-Level`-header is in place:

```python
def visibleToRole(published, role, permission='View'):
    request = getRequest()
    if request.getHeader('X-Esi-Level'):
        return True
    else:
        return role in rolesForPermissionOn(permission, published)
```

Please, don\'t do this, unless you really know and test what you are
doing!

Because something crucial is still missing: Even with the private cache
for ESI tiles, Varnish will still cache tiles just by URL. And that
would mean that, by default, all users would get whatever version of the
tile was cached first.

To really make it safe to cache restricted tiles for logged-in users, we
must ensure that cacheable tiles should have unique URL for users with
different roles. We fixed this by implementing a custom transform, which
hashes roles of the current user (with time based salt) into an extra
query string parameter for each tile URL in the rendered page. The
result: **users with same set of roles share the same cache of tiles**.
Fast.
