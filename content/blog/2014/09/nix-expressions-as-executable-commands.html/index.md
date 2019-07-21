---
title: Nix expressions as executable commands
date: "2014-09-11T06:00:00Z"
tags: ["nix", "python"]
---

**Updated 2015-07-07:** [Stateless Nix environment
revisited](http://datakurre.pandala.org/2015/07/stateless-nix-environments-revisited.html)
Consider this entry deprecated.

**Updated 2014-09-24:** I learned that in a mixed (OSX and nixpkgs)
environment, one should not set `LD_LIBRARY_PATH`, but fix dynamic
linking to use absolute paths. Yet, I refactored my wrapper to use
*myEnvFun* when required (see the buildout example).

**Updated 2014-09-22:** I was wrong about, how nix-built Python
environments could be used together with
[buildout](https://pypi.python.org/pypi/zc.buildout) and updated this
post to reflect my experiences.

My main tools for Python based software development have been
[virtualenv](https://pypi.python.org/pypi/virtualenv) and
[buildout](https://pypi.python.org/pypi/zc.buildout) for a long time.
I\'ve used virtualenv for providing isolated Python installation
(separate from so often polluted system python) and buildout for
managing both the required Python packages, developed packages, and
supporting software (like Redis or memcached).

Basically everything still works, but:

-   Managing clean Python virtualenvs for only to avoid possible
    conflicts with system installed packages feels a lot of work with a
    small return.
-   Remembering to activate and deactivate the correct Python virtualenv
    is not fun either.
-   Also, while buildout provides excellent tool
    ([mr.developer](https://pypi.python.org/pypi/mr.developer)) for
    managing sources for all the project packages, it\'s far from
    optimal for building and managing supporting (not Python) software.

I\'ve also using quite a bit of Vagrant and Docker, but, because I\'m
mostly working on Mac, those require a VM, which makes them much less
convenient.

About Nix
---------

I believe, I heard about [Nix](http://nixos.org/nix/) package manager
from [Rok](http://garbas.si/) at the first time at [Barcelona Plone
Testing Sprint](http://www.coactivate.org/projects/barcelona-sprint) in
the early 2013. It sounded a bit esoteric and complex back then, but
after about about twenty months of more virtualenvs, buildouts,
Vagrantfiles, Docker containers and puppet manifests\... not so much
anymore.

Currently, outside [NixOS](http://nixos.org/), I understand Nix as

1)  a functional language for describing configuration of software and
2)  a package manager for managing those configurations.

From my own experience, the easiest way to get familiar with Nix is to
follow [Domen](https://www.domenkozar.com/)\'s [blog post about getting
started with Nix package
manager](https://www.domenkozar.com/2014/01/02/getting-started-with-nix-package-manager/).
But to really make it a new tool to your toolbox, you should learn to
[write your own Nix
expressions](http://nixos.org/nix/manual/#chap-writing-nix-expressions).

Even the the most common way to use the Nix package manager is to
install Nix expressions into your current environment with **nix-env**,
the expressions can also be used without really installing them, in a
quite stateless way.

I\'m not sure how proper use of Nix this is, but it seems to work for
me.

(Yes, I\'m aware of **myEnvFun**, for creating named stateful
development environments with Nix expressions, but here I\'m trying to
use Nix in a more stateless, Docker-inspired way.)

Nix expressions as virtualenv replacements
------------------------------------------

It\'s almost never safe to install a Python software directly into your
system Python. Different software may require different versions of same
libraries and sooner than later the conflicting requirements break your
Python installation.

Let\'s take a small utility software called [i18ndude](https://pypi.org/project/i18ndude/) as an example
of such software with way too frightening dependencies for any system
Python. Traditionally, you could install it into a separate Python
virtualenv and use it with the following steps:

```shell
$ virtualenv ~/.../i18ndude-env
$ source ~/.../i18ndude-env/bin/activate
$ pip install i18ndude
$ i18ndude
...
$ deactivate
```

With an executable Nix expression, I can call it in a stateless way with
simply executing the expression:

```shell
$ ./i18ndude.nix
➜ /nix/store/gjhzw843qs1736r0qcd9mz69247g4svb-python2.7-i18ndude-3.3.5/bin/i18ndude
usage: i18ndude [-h]
                {find-untranslated,rebuild-pot,merge,sync,filter,admix,list,trmerge}
                ...
18ndude: error: too few arguments
```

Maybe even better, I can install the expression into my default Nix
environment with

```shell
$ nix-env -i -f i18ndude.nix
```

and use it like it would have been installed into my system Python in
the first place (but this time without polluting it):

```shell
$ i18ndude.nix
usage: i18ndude [-h]
                {find-untranslated,rebuild-pot,merge,sync,filter,admix,list,trmerge}
                ...
18ndude: error: too few arguments
```

No more activating or deactivating virtualenvs, not to mention about
needing to remember their names or locations.

For the most common Python softare, it\'s not required to write your own
expression, but you could simply install the contributed expressions
directly from Nix packages repository.

The easiest way to check for existing expressions from nixpkgs Python
packages seems to be grepping the package list with
`nix-env -qaP \*|grep something`.

If you\'d like to see more packages available by default, you can
contribute them to
[upstream](https://github.com/NixOS/nixpkgs/blob/master/pkgs/top-level/python-packages.nix)
with a simple pull request.

Anyway, since [i18ndude](https://pypi.org/project/i18ndude/) was not yet available in time of writing
(although, most of its dependencies were), this is how my expression for
it looked like:

```
#!/usr/bin/env nix-exec
with import <nixpkgs> { };

let dependencies = rec {
  ordereddict = buildPythonPackage {
    name = "ordereddict-1.1";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/o/ordereddict/ordereddict-1.1.tar.gz";
      md5 = "a0ed854ee442051b249bfad0f638bbec";
    };
  };
};

in with dependencies; rec {
  i18ndude = buildPythonPackage {
    name = "i18ndude-3.3.5";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/i/i18ndude/i18ndude-3.3.5.zip";
      md5 = "ef599b1c64eaabba4049fcd2b027ba21";
    };
    propagatedBuildInputs = [
      ordereddict
      python27Packages."zope.tal-3.5.2"
      python27Packages."plone.i18n-2.0.9"
    ];
  };
}
```

Nix expression for *nix-exec* shell wrapper
-------------------------------------------

Of course, Nix expressions are not executable by default. To get them
work as I wanted, I had to create tiny [wrapper
script](https://gist.github.com/datakurre/7a3c9eaf6ba51e9d8bd5) to be
used as the hash-bang line `#!/usr/bin/env nix-exec` of executable
expressions.

The script simply calls **nix-build** and then the named executable from
the build output directory (with some standard environment variables
set). To put it another way, the wrapper script translates the following
command:

```shell
$ ./i18ndude.nix --help
```

into

```shell
$ `nix-build --no-out-link i18ndude.nix`/bin/i18ndude --help
```

It\'s not required to suffix the expressions fiels with `.nix`, but they
could also be named without suffix to look more like real commands.

The wrapper script itself, of course, can be installed from a Nix
expression into your default Nix environment with
`nix-env -i -f filename.nix`:

```
with import <nixpkgs> { };

stdenv.mkDerivation {
  name = "datakurre-nix-exec-1.2.1";

  builder = builtins.toFile "builder.sh" "
    source $stdenv/setup
    mkdir -p $out/bin
    echo \"#!/bin/bash
build=\\`nix-build --no-out-link \\$1\\`
if [ \\$build ]; then

  MY_TZ=\\\"\\$TZ\\\"
  MY_PATH=\\\"\\$build/bin:\\$build/sbin:\\$build/libexec:\\$PATH\\\"
  MY_http_proxy=\\\"\\$http_proxy\\\"
  MY_ftp_proxy=\\\"\\$http_proxy\\\"

  if [ -d \\$build/dev-envs ]; then
    source \\\"\\$build/dev-envs/\\\"*

    export TZ=\\\"\\$MY_TZ\\\"
    export PATH=\\\"\\$PATH:\\$MY_PATH\\\"
    export http_proxy=\\\"\\$MY_http_proxy\\\"
    export ftp_proxy=\\\"\\$MY_ftp_proxy\\\"

    export CFLAGS=\\`echo \\$NIX_CFLAGS_COMPILE|sed 's/-isystem /-I/g'\\`
    export LDFLAGS=\\$NIX_LDFLAGS
  else
    export PATH=\\\"\\$MY_PATH\\\"
  fi

  cmd=\\$\{1##*/\}; cmd=\\$\{cmd%%@*\}; cmd=\\$\{cmd%.nix\}
  paths=(\\\"\\$build/bin\\\" \\\"\\$build/sbin\\\" \\\"\\$build/libexec\\\")
  for path in \\\"\\$\{paths[@]\}\\\"; do
    if [ -f \\\"\\$path/\\$\{cmd\}\\\" ]; then
      cmd=\\\"\\$path/\\$\{cmd\}\\\"
      break
    fi
  done

  if [ -t 1 ]; then echo \\\"➜\\\" \\$cmd \\\"\\$\{@:2\}\\\"; fi
  \\\"\\$cmd\\\" \\\"\\$\{@:2\}\\\"
fi
\" > $out/bin/nix-exec
    chmod a+x $out/bin/nix-exec
  ";
}
```

The wrapper does execute the expression defined command in a fully clean
environment (the only isolation is the one *myEnvFun* provides), but
mostly prepends everything defined by the expression into its
surrounding execution environment (so that its paths are preferred over
the versions in the current environment).

A mostly positive side effect from using Nix expressions like this (only
building them, but not installing them into any environment) is that
they can be cleaned (from the disk) anytime with simply:

```shell
$ nix-collect-garbage
```

Nix expressions with buildout
-----------------------------

**Update 2014-09-24:** The example was updated to use *myEnvFun* to
simplify the wrapper script.

**Update 2014-09-22:** I originally covered Nix expressions with
buildout as an example of replacing Python virtualenvs with Nix.
Unfortunately, because of some buildout limitations that didn\'t work
out as I expected\...

A very special case of Python development environment is the one with
[buildout](https://pypi.python.org/pypi/zc.buildout), which is required
e.g. for all development with [Plone](http://plone.org/).

When using Nix expressions with
[buildout](https://pypi.python.org/pypi/zc.buildout), there is a one
very special limitation: **buildout does not support any additional
Python packages installed into your Nix expression based environment**.

That\'s because buildout sees Nix defined Python as a system Python, and
buildout does its best to prevent any extra packages installed into
system Python being available for the buildout by default.

An additional issue for buildout is that the extra Python packages
defined in Nix expression are not installed directly into under the
Python installation, but are made available only when that Python is
executed through a specialc Nix generated wrapper.

But to cut this short, here\'s an example executable Nix expression,
which could be used as a [Plone](http://plone.org/)-compatible Python
environment. It includes a clean Python installation with some
additional (non-Python) libraries required by Plone buildout to be able
to compile a few special Python packages (like [Pillow](https://pypi.org/project/Pillow/), [lxml](https://pypi.org/project/lxml/) and
[python-ldap](https://pypi.org/project/python-ldap/)):

```
#!/usr/bin/env nix-exec
with import <nixpkgs> { };

let dependencies = rec {
  buildInputs = [
    cyrus_sasl
    openldap
    libxslt
    libxml2
    freetype
    libpng
    libjpeg
    python27Full
  ];
};

in with dependencies; buildEnv {
  name = "nix";
  paths = [(myEnvFun { name = "nix"; inherit buildInputs; })] ++ buildInputs;
}
```

With this Nix expression named as an executable `./python.nix`, it could
be used to execute buildout\'s bootstrap, buildout and eventually
launching the Plone site like:

```shell
$ ./python.nix bootstrap.py
$ ./python.nix bin/buildout  # or ./python.nix -S bin/buildout
$ ./python.nix bin/instance fg
```

I must agree that this is not as convenient as it should be, because
each command (bootstrap, buildout and the final buildout generated
script) must be executed explicitly using our executable Nix expression
defining the required Python-environment.

Also, probably because my wrapper does not completely isolate the Nix
expression call from its surrounding environment, sometimes it\'s
required to call the buildout with `-S` given for the Python expression,
like `./python.nix -S bin/buildout` (otherwise buildout does not find
it\'s own bootstrapped installation).

On the other hand, this approach defines the execution environment
explicitly and statelessly for each call.

P.S. Because I\'m working with RHEL systems, it\'s nice to use Python
with similar configuration with those. With Nix, it\'s easy to define
local overrides for existing packages (nixpkgs derivations) there\'s a
special function with only the required configuration changes. The
following `~/.nixpkgs/config.nix`-example configures Python with similar
unicode flag to RHEL\'s native Python:

```
{
  packageOverrides = pkgs : with pkgs; rec {
    python27 = pkgs.python27.overrideDerivation (args: {
      configureFlags = "--enable-shared --with-threads --enable-unicode=ucs4";
    }) // { modules = pkgs.python27.modules; };
  };
}
```

Nix expressions as stateless development environments
-----------------------------------------------------

**Updated 2014-09-24:** Because of OSX, I had to fix openldap expression
to fix link one library with absolute path to not allow it to resolve an
OSX library instead of the Nix built one.

In test driven development, the whole development environment can be
built just around the selected test runner.

Here\'s an example Nix expression, which saved as an executable file
called `./py.test` can be used to execute [pytest](https://pypi.org/project/pytest/) test runner with a
couple of selected plugins and all the dependencies required by the
tested software in question:

```
#!/usr/bin/env nix-exec
with import <nixpkgs> { };

let dependencies = rec {
  execnet = buildPythonPackage {
    name = "execnet-1.2.0";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/e/execnet/execnet-1.2.0.tar.gz";
      md5 = "1886d12726b912fc2fd05dfccd7e6432";
    };
    doCheck = false;
  };
  pycparser = buildPythonPackage {
    name = "pycparser-2.10";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/p/pycparser/pycparser-2.10.tar.gz";
      md5 = "d87aed98c8a9f386aa56d365fe4d515f";
    };
  };
  cffi = buildPythonPackage {
    name = "cffi-0.8.6";
    src = fetchurl {
      url = "http://pypi.python.org/packages/source/c/cffi/cffi-0.8.6.tar.gz";
      md5 = "474b5a68299a6f05009171de1dc91be6";
    };
    propagatedBuildInputs = [ pycparser ];
  };
  pytest_cache = buildPythonPackage {
    name = "pytest-cache-1.0";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/p/pytest-cache/pytest-cache-1.0.tar.gz";
      md5 = "e51ff62fec70a1fd456d975ce47977cd";
    };
    propagatedBuildInputs = [
       python27Packages.pytest
       execnet
    ];
  };
  pytest_flakes = buildPythonPackage {
    name = "pytest-flakes-0.2";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/p/pytest-flakes/pytest-flakes-0.2.zip";
      md5 = "44b8f9746fcd827de5c02f14b01728c1";
    };
    propagatedBuildInputs = [
       python27Packages.pytest
       python27Packages.pyflakes
       pytest_cache
    ];
  };
  pytest_pep8 = buildPythonPackage {
    name = "pytest-pep8-1.0.6";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/p/pytest-pep8/pytest-pep8-1.0.6.tar.gz";
      md5 = "3debd0bac8f63532ae70c7351e73e993";
    };
    propagatedBuildInputs = [
      python27Packages.pytest
      python27Packages.pep8
      pytest_cache
    ];
  };
  buildInputs = [
    (python27Packages.pytest.override {
      propagatedBuildInputs = [
        python27Packages.readline
        python27Packages.plumbum
        python27Packages.py
        pytest_flakes
        pytest_pep8
      ];
    })
    (lib.overrideDerivation openldap (args: {
      postBuild = if stdenv.isDarwin then ''
        install_name_tool -change /libsasl2.dylib ${cyrus_sasl}/lib/libsasl2.dylib servers/slapd/slapadd
     '' else null;
    }))
  ];
};

in with dependencies; buildEnv {
  name = "nix";
  paths = [(myEnvFun { name = "nix"; inherit buildInputs; })] ++ buildInputs;
}
```

In other words, this expression could work as a stateless environment
for developing the product in question:

```shell
$ ./py.test
➜ /nix/store/a2w3hwc66gqm6bncic8km6b69lw2byc6-py.test/bin/py.test
================================== test session starts ==================================
platform darwin -- Python 2.7.8 -- pytest-2.5.1
plugins: flakes, cache, pep8
collected 2 items

src/.../tests/test_things.py ..
=============================== 2 passed in 0.22 seconds ================================
```

And, once the development is completed, an another expression could be
defined for using the developed product.

Nix expression for Robot Framework test runner
----------------------------------------------

Finally, as a bonus, here\'s an expression, which configures a Python
environment with [Robot Framework](http://robotframework.org) and its
[Selenium2Library](https://pypi.python.org/pypi/robotframework-selenium2library)
with [PhantomJS](http://phantomjs.org):

```
#!/usr/bin/env nix-exec
with import <nixpkgs> { };

let dependencies = rec {
  docutils = buildPythonPackage {
    name = "docutils-0.12";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/d/docutils/docutils-0.12.tar.gz";
      md5 = "4622263b62c5c771c03502afa3157768";
    };
  };
  selenium = buildPythonPackage {
    name = "selenium-2.43.0";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/s/selenium/selenium-2.43.0.tar.gz";
      md5 = "bf2b46caa5c1ea4b68434809c695d69b";
    };
  };
  decorator = buildPythonPackage {
    name = "decorator-3.4.0";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/d/decorator/decorator-3.4.0.tar.gz";
      md5 = "1e8756f719d746e2fc0dd28b41251356";
    };
  };
  robotframework = buildPythonPackage {
    name = "robotframework-2.8.5";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/r/robotframework/robotframework-2.8.5.tar.gz";
      md5 = "2d2c6938830f71a6aa6f4be32227997f";
    };
    propagatedBuildInputs = [
      docutils
    ];
  };
  robotframework-selenium2library = buildPythonPackage {
    name = "robotframework-selenium2library-1.5.0";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/r/robotframework-selenium2library/robotframework-selenium2library-1.5.0.tar.gz";
      md5 = "07c64a9e183642edd682c2b79ba2f32c";
    };
    propagatedBuildInputs = [
      robotframework
      decorator
      selenium
    ];
  };
};

in with dependencies; buildEnv {
  name = "pybot";
  paths = [
    phantomjs
    (robotframework.override {
      propagatedBuildInputs = [ robotframework-selenium2library ];
    })
  ];
}
```

Since you may need differently configured Robot Framework installations
(with different add-on keyword libraries installed) for different
projects, this should be a good fit as an executable Nix expression:

```shell
$ ./pybot.nix
➜ /nix/store/q15bimgng25qcxkq2q10finyk0n6qkm2-pybot/bin/pybot
[ ERROR ] Expected at least 1 argument, got 0.

Try --help for usage information.
```
