---
title: Generating Plone theming mockups with Chameleon
date: "2015-09-06T06:00:00Z"
tags: ["Chameleon", "Diazo", "Plone", "Templating", "Theming"]
---

Some days ago there was a question at the Plone IRC-channel, whether the
[Plone](https://www.plone.com/) theming tool supports *template
inheritance* \[sic\]. The answer is no, but let\'s play a bit with the
problem.

The prefered theming solution for Plone,
[plone.app.theming](https://pypi.python.org/pypi/plone.app.theming/), is
based on [Diazo](https://docs.diazo.org/) theming engine, which allows
to make a Plone theme from any static HTML mockup. To simplify a bit,
just get a static HTML design, write a set of Diazo transformation
rules, and you\'ll have a new Plone theme.

The ideal behind this theming solution is to make the theming story for
Plone the easiest in the CMS industry: Just buy a static HTML design and
you could use it as a theme as such. (Of course, the complexity of the
required Diazo transformation rules depends on the complexity of the
theme and themed content.)

But back to the original problem: Diazo encourages the themer to use a
plenty of different HTML mockups to keep the transformation rules
simple. One should not try to generate theme elements for different page
types in Diazo transformation rules, but use dedicated HTML mockups for
different page types. But what if the original HTML design came only
with a very few selected mockups, and creating the rest from those is up
to you. You could either copy and paste, or\...

Here comes a proof of concept script for generating HTML mockups from
[TAL](https://en.wikipedia.org/wiki/Template_Attribute_Language) using
[Chameleon](https://pypi.python.org/pypi/Chameleon) template compiler
(and [Nix](https://nixos.org/nix/) to remove need for virtualenv,
because of Python dependencies).

But at first, why TAL? Because METAL macros of TAL can be used to make
the existing static HTML mockups into re-usable macros/mixins with
customizable slots with minimal effort.

For example, an existing HTML mockup:

```html

<html>
<head>...</head>
<body>
...
<div>
Here be dragons.
</div>
...
</body>
<html>
```

Could be made into a re-usable TAL template (`main_template.html`) with:

```html
<metal:master define-macro="master">
<html>
<head>...</head>
<body>
...
<div metal:define-slot="content">
Here be dragons.
</div>
...
</body>
<html>
</metal:master>
```

And re-used in a new mockup with:

```html
<html metal:use-macro="main_template.macros.master">
<body>
<div metal:fill-slot="content">
Thunderbirds are go!
</div>
</body>
<html>
```

Resulting a new compiled mockup:

```html
<html>
<head>...</head>
<body>
...
<div>
Thunderbirds are go!
</div>
...
</body>
```

The script maps all direct sub-directories and files with `.html` suffix
in the same directory with the compiled template into its TAL namespace,
so that macros from those can be reached with METAL syntax
`metal:use-macro="filebasename.macros.macroname"` or
`metal:use-macro="templatedirname['filebasename'].macros.macroname"`.

Finally, here comes the [example
code](https://gist.github.com/datakurre/36fd22332baa70033c56):

```python
#! /usr/bin/env nix-shell
#! nix-shell -i python -p pythonPackages.chameleon pythonPackages.docopt pythonPackages.watchdog
"""Chameleon Composer

Copyright (c) 2015 Asko Soukka <asko.soukka@iki.fi>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Usage:
  ./compose.py <filename>
  ./compose.py src/front-page.html
  ./compose.py <source> <destination> [--watch]
  ./compose.py src build
  ./compose.py src build --watch

"""
from __future__ import print_function
from chameleon import PageTemplateFile
from chameleon import PageTemplateLoader
from docopt import docopt
from watchdog.observers import Observer
from watchdog.observers.polling import PollingObserver
from watchdog.utils import platform
import os
import sys
import time


def render(template):
    assert os.path.isfile(template)

    # Add siblings as templates into compilation context for macro-use
    context = {}
    dirname = os.path.dirname(template)
    for name in os.listdir(dirname):
        path = os.path.join(dirname, name)
        basename, suffix = os.path.splitext(name)
        if os.path.isdir(path):
            context[basename] = PageTemplateLoader(path, '.html')
        elif suffix == '.html':
            context[basename] = PageTemplateFile(path)

    return PageTemplateFile(template)(**context).strip()


class Composer(object):
    def __init__(self, source, destination):
        self.source = source
        self.destination = destination
        self.mapping = {}
        self.update()

    def update(self):
        source = self.source
        destination = self.destination
        mapping = {}

        # File to file
        if os.path.isfile(source) and os.path.splitext(destination)[-1]:
            mapping[source] = destination

        # File to directory
        elif os.path.isfile(source) and not os.path.splitext(destination)[-1]:
            mapping[source] = os.path.join(
                destination,
                os.path.splitext(os.path.basename(source))[0] + '.html'
            )

        # Directory to directory
        elif os.path.isdir(source):
            for filename in os.listdir(source):
                path = os.path.join(source, filename)
                if os.path.splitext(path)[-1] != '.html':
                    continue
                mapping[path] = os.path.join(
                    destination,
                    os.path.splitext(os.path.basename(path))[0] + '.html'
                )

        self.mapping = mapping

    def __call__(self):
        for source, destination in self.mapping.items():
            if os.path.dirname(destination):
                if not os.path.isdir(os.path.dirname(destination)):
                    os.makedirs(os.path.dirname(destination))
            with open(destination, 'w') as output:
                print('{0:s} => {1:s}'.format(source, destination))
                output.write(render(source).strip().encode('utf-8'))

    # noinspection PyUnusedLocal
    def dispatch(self, event):
        # TODO: Build only changed files
        self.update()
        self.__call__()

    def watch(self):
        if platform.is_darwin():
            observer = PollingObserver()  # Seen FSEventsObserver to segfault
        else:
            observer = Observer()
        observer.schedule(self, self.source, recursive=True)
        observer.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()
        sys.exit(0)


if __name__ == '__main__':
    arguments = docopt(__doc__, version='Chameleon Composer 1.0')

    if arguments.get('<filename>'):
        print(render(arguments.get('<filename>')))
        sys.exit(0)

    composer = Composer(arguments.get('<source>'),
                        arguments.get('<destination>'))
    composer()

    if arguments.get('--watch'):
        print('Watching {0:s}'.format(arguments.get('<source>')))
        composer.watch()
```
