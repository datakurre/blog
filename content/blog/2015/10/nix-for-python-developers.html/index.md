---
title: Nix for Python developers
date: "2015-10-28T06:00:00Z"
tags: ["Python", "Docker", "Nix"]
---

About a week ago, I had the pleasure of giving a [presentation about my
Nix
experiences](http://www.slideshare.net/datakurre/nix-for-python-developers)
at [PyCon Finland 2015](http://fi.pycon.org/2015/). This is an executive
afterthought summary of that presentation, focusing only on **how to use
Nix to build development environments**. With a few cool additional
examples.

Installing Nix
--------------

The easiest way to install Nix for development usage is the default
single user installation:

```shell
$ sudo mkdir /nix
$ bash <(curl https://nixos.org/nix/install)
```

The default installation of Nix would install and build everything under
that `/nix`, which makes it easy to uninstall Nix at any point by simply
deleting that directory. It also comes configured for the latest nixpkgs
release. ([Nix](https://nixos.org/nix/) is just the generic build system
and package manager, [nixpkgs](https://nixos.org/nixpkgs/) is the
recommended community managed package collection for it.)

After a successful installation, available packages can searched with:

```shell
nix-env -qaP|grep -i needle
```

Alternative installation methods would be to follow that installer
script manually, build Nix from source or request your Linux
distribution to package it for you. Read more about all the options and
basic Nix usage at [Nix Package Manager
Guide](http://nixos.org/nix/manual/). Building Nix from source would
allow to choose where stores the build (other place than `/nix`), but
that would also prevent it using the community binary caches (by default
Nix tries to download builds from the community binary cache at first
and only then build them locally).

Next you want to create a Nix configuration file `/etc/nix/nix.conf`
with the following content of a couple of special configuration flags:

```properties
gc-keep-outputs = true
build-use-chroot = true
```

Option `gc-keep-outputs = true` will configure Nix garbage collector to
be more developer friendly by not collecting build-time-only
dependencies so easily. Option `build-use-chroot` will trigger isolated
builds to ensure that nothing from your existing system can affect Nix
builds.

At any point of Nix use, you could clean up `/nix` and possibly free
some disk space by simply running its garbage collector:

```shell
$ nix-collect-garbage -d
```

Never ever manually remove files from `/nix` unless you are completely
uninstalling it.

Nix offically supports Linux and OS X. Yet, if you are using OS X, you
should read [special instructions from the wiki for OS
X](https://nixos.org/wiki/Nix_on_OS_X). The OS X support has been in
heavy development lately and not all available packages build yet on OS
X. In addition to reading thw wiki page, you want to add the following
lines into `/etc/nix/nix.conf` to ensure that Nix uses all available
binary builds also on OS X:

```properties
binary-caches = https://cache.nixos.org https://hydra.nixos.org
use-binary-caches = true
```

For all OS X related Nix issues, you can get help from \#\#nix-darwin
channel at Freenode IRC network.

The community members told me having used Nix also on Cygwin, FreeBSD,
OpenBSD, NetBSD, OpenSolaris and SmartOS. Yet, on other systems, you
would need to learn more about [how nixpkgs
work](https://nixos.org/nixpkgs/manual/) to get on of its standard build
environments to work on your system.

Using Nix
---------

Finally, let the fun begin:

### Run anything with a one-liner

`nix-shell` can be used to run anything available in nixpkgs simply
with:

```
$ nix-shell -p package --run "command"
```

For example:

```
$ nix-shell -p python35 --run "python3"
```

Or:

```
$ nix-shell -p redis --run "redis-server"
$ nix-shell -p nodejs --run "node"
$ nix-shell -p graphviz --run "dot -V"
$ nix-shell -p texLive --run "pdflatex --help"
```

Or with any number of packages:

```
$ nix-shell -p redis -p python35Packages.redis --run "python3"
```

Nix would simply either downloard or build all the defined packages,
build a combined environment with all of them and then execute the given
command in that environment. Everything would be installed under `/nix`
and cleaned by garbage collector with `nix-collect-garbage -d`.

### Get into shell with anything with a one-liner

Calling `nix-shell` without `--run` would drop you into an interactive
shell with the required dependencies:

```shell
$ nix-shell -p texLive -p gnumake -p redis -p python35
```

Entering `exit` would exit the shell as usual.

Additionally, adding `--pure` into `nix-shell` arguments, would limit
PATH and other environment variables to only include the listed packges
while inside the shell.

### Define script dependencies in a hashbang

`nix-shell` can also be used in a shell script
[hashbang](https://en.wikipedia.org/wiki/Shebang_(Unix)) line to execute
the script in an environment with any required dependencies:

```shell
#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p python35Packages.tornado -p nodejs
```

The first line `#! /usr/bin/env nix-shell` is a standard hasbang-line,
but with `nix-shell` it can follow any number of `#! nix-shell` lines
defining the required dependencies using `nix-shell` command line
arguments.

The most common arguments for nix-shell in hashbang use are:

-   `-p` to define packages available in the execution environment
-   `-i` to define the interpreter command (from listed packages) used
    to actually run the script.

[More examples are available in the Nix
manual.](https://nixos.org/nix/manual/#sec-nix-shell)

### Build complex development environments with Nix expressions

When one-liners are not enough, it\'s possible to define a more complete
development environment using the functional [Nix expression
language](http://nixos.org/nix/manual/#chap-writing-nix-expressions).
Both `nix-shell` and `nix-build` can take a file with such expression as
their first optional positional argument. Also both look for a file
named `./default.nix` by default.

You could use the following example as the base for your
`./default.nix`:

```nix
with import <nixpkgs> {};
stdenv.mkDerivation rec {
  name = "env";

  # Mandatory boilerplate for buildable env
  env = buildEnv { name = name; paths = buildInputs; };
  builder = builtins.toFile "builder.sh" ''
    source $stdenv/setup; ln -s $env $out
  '';

  # Customizable development requirements
  buildInputs = [
    # Add packages from nix-env -qaP | grep -i needle queries
    redis

    # With Python configuration requiring a special wrapper
    (python35.buildEnv.override {
      ignoreCollisions = true;
      extraLibs = with python35Packages; [
        # Add pythonPackages without the prefix
        redis
        tornado
      ];
    })
  ];

  # Customizable development shell setup with at last SSL certs set
  shellHook = ''
    export SSL_CERT_FILE=${cacert}/etc/ssl/certs/ca-bundle.crt
  '';
}
```

Running

```shell
$ nix-build
```

would now create symlinked directory `./result` with `./result/bin` with
both `./result/bin/redis` and `./result/bin/python3` with *redis* and
*tornado* as importable packages. That build is comparable to familiar
Python [virtualenv](https://pypi.python.org/pypi/virtualenv), but for
any dependencies, not just Python packages.

The resulting Python interpreter `./result/bin/python3` could also be
used with IDE, e.g. configured as a project interpreter for PyCharm.

The resulting directory name can be changed from *result* into something
else with argument `-o myname`. The directory also works as a so called
garbage collection root, which prevents Nix garbage collection from
clearing it until the directory (symlink) has been renamed, moved or
deleted.

Running

```shell
$ nix-shell
```

would enter into an interactive shell with all dependencies in path as
expected.

Running

```shell
$ nix-shell --run "python3"
```

would start that Python interpreter defined in `./default.nix` with
*tornado* and *redis* packages (and also the redis server available in
the process\' environment).

Finally, to turn the environment into a distributable docker container,
check my [Nix to Docker build
pack](https://github.com/datakurre/nix-build-pack-docker) example at
GitHub.

### Add custom dependencies into a Nix expression

Sometimes, yet unfortunatley often with Python packages, not all your
dependencies are defined in nixpkgs already. The best solution, of
course, would be to make pull requests to add them there, but it\'s also
possible to just define them per project in the very same project
specific `./default.nix`.

For example, let\'s upgrade *tornado* into its latest beta, and add a
comeletely new Python package, *redis\_structures*, with the following
dependencies pattern:

```nix
with import <nixpkgs> {};
let dependencies = rec {

  # Customized existing packages using expression override
  _tornado = with python35Packages; tornado.override rec {
    name = "tornado-4.3b1";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/t/tornado/${name}.tar.gz";
      sha256 = "c7ddda61d9469c5745f3ac00e480ede0703dd1a4ef540a3d9bd5e03e9796e430";
    };
  };

  # Custom new packages using buildPythonPackage expression
  _redis_structures= with python35Packages; buildPythonPackage rec {
    name = "redis_structures-0.1.3";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/r/redis_structures/${name}.tar.gz";
      sha256 = "4076cff3ea91b7852052d963bfd2533c74e8a0054826584e058e685a911f56c5";
    };
    # Fix broken packaging (package is missing README.rst)
    prePatch = "touch README.rst";
    # Define package requirements (without pythonPackages prefix)
    propagatedBuildInputs = [ redis ];
  };
};
in with dependencies;
stdenv.mkDerivation rec {
  name = "env";

  # Mandatory boilerplate for buildable env
  env = buildEnv { name = name; paths = buildInputs; };
  builder = builtins.toFile "builder.sh" ''
    source $stdenv/setup; ln -s $env $out
  '';

  # Customizable development requirements
  buildInputs = [
    # Add packages from nix-env -qaP | grep -i needle queries
    redis

    # With Python configuration requiring a special wrapper
    (python35.buildEnv.override {
      ignoreCollisions = true;
      extraLibs = with python35Packages; [
        # Add pythonPackages without the prefix
        _tornado
        _redis_collections
      ];
    })
  ];

  # Customizable development shell setup with at last SSL certs set
  shellHook = ''
    export SSL_CERT_FILE=${cacert}/etc/ssl/certs/ca-bundle.crt
  '';
}
```

See the full explanation of [buildPythonPackage-expression in nixpkgs
manual](https://nixos.org/nixpkgs/manual/#ssec-build-python-package).

Generating Nix expressions
--------------------------

The only real issue in using Nix with Python is that only a portion of
packages released at [PyPI](https://pypi.python.org/) are available in
nixpkgs. And those, which are available, have usually only the latest
version there.

If it would be trivial to generate Nix-expressions for all public Python
packages, that would have already been done. Unfortunately, it\'s not
and it\'s not been done. And it\'s not because of Nix, but because of
the various imperfect ways how Python packages can define their
dependencies.

I was told that things would get better once
[PEP426](https://www.python.org/dev/peps/pep-0426/) is implemented and
used in practice.

Nevertheless, there are many tools to try for generating and maintaining
Nix expressions for Python packages and projects. Each of them may
emphase different things and may or may not always produce directly
usable expression:

-   <https://github.com/garbas/pypi2nix>
-   <https://github.com/offlinehacker/pypi2nix>
-   <https://github.com/proger/python2nix>
-   <https://github.com/ktosiek/pip2nix>
-   <https://github.com/datakurre/collective.recipe.nix>

Personally I\'m using and developing only
[collective.recipe.nix](https://pypi.python.org/pypi/collective.recipe.nix),
which is currently only usable out of the box for Python 2.7 projects,
I\'m working on support for Python 3.x projects and easier usage.

Full example project
--------------------

Finally, let\'s try developing a [demo Python 3.5 async / await
HTTP-AMQP-bridge](https://gist.github.com/datakurre/2076247049dabe16627f):
a http-service, which distributes all the request to workers through
AMQP broker. Just for fun:

```shell
$ git clone https://gist.github.com/datakurre/2076247049dabe16627f
$ cd 2076247049dabe16627f
$ ls -1
connection.py
default.nix
server.py
setup.py
supervisord.nix
worker.py
```

This project only has a few files:

`./setup.py`

:   to define the python package

`./connection.py`

:   to manage the AMQP connection and give a new channel when requested
    (AMQP channels are kind of virtual AMQP connections running on top
    of the one real connection)

`./server.py`

:   to run a tornado server to handle the incoming requests by passing
    them to AMQP broker and returning the result

`./worker.py`

:   to handle requests from AMQP broken and return the results back to
    the serer.

`./default.nix`

:   the nix expression to setup up a development environment with
    RabbitMQ and Python with required packages

`./supervisord.nix`

:   an alternative nix expression for setting an environment with
    pre-configured supervisord.

Let see the `./default.nix` in detail:

```nix
with import <nixpkgs> {};
let dependencies = rec {
  _erlang = erlang.override { wxSupport = false; };
  _rabbitmq_server = rabbitmq_server.override { erlang = _erlang; };
  _enabled_plugins = builtins.toFile "enabled_plugins" "[rabbitmq_management].";
  _tornado = with python35Packages; tornado.override {
    name = "tornado-4.3b1";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/t/tornado/tornado-4.3b1.tar.gz";
      sha256 = "c7ddda61d9469c5745f3ac00e480ede0703dd1a4ef540a3d9bd5e03e9796e430";
    };
  };
  _aioamqp = with python35Packages; buildPythonPackage {
    name = "aioamqp-0.4.0";
    src = fetchurl {
      url = "https://pypi.python.org/packages/source/a/aioamqp/aioamqp-0.4.0.tar.gz";
      sha256 = "4882ca561f1aa88beba3398c8021e7918605c371f4c0019b66c12321edda10bf";
    };
  };
};
in with dependencies;
stdenv.mkDerivation rec {
  name = "env";
  env = buildEnv { name = name; paths = buildInputs; };
  builder = builtins.toFile "builder.pl" ''
    source $stdenv/setup; ln -s $env $out
  '';
  buildInputs = [
    _rabbitmq_server
    (python35.buildEnv.override {
      ignoreCollisions = true;
      extraLibs = [
        _tornado
        _aioamqp
      ];
    })
  ];
  shellHook = ''
    mkdir -p $PWD/var
    export RABBITMQ_LOG_BASE=$PWD/var
    export RABBITMQ_MNESIA_BASE=$PWD/var
    export RABBITMQ_ENABLED_PLUGINS_FILE=${_enabled_plugins}
    export SSL_CERT_FILE=${cacert}/etc/ssl/certs/ca-bundle.crt
    export PYTHONPATH=`pwd`
  '';
}
```

The most interesting part is the `shellHook` (for the `nix-shell`
command) at the end, which configures RabbitMQ server to be run so that
its state is stored under the current project directory (`./var`). Also
note, how `builtins.toFile` nix command is used to create a project
specific configuration file for RabbitMQ, to be stored in Nix-store (to
not bloat the project directory and to be purged with Nix garbage
collector). Any app supporting configuration using environment variables
could have a development environment specific configuration in the same
way.

To test this out, simply start a few terminals to start RabbitMQ, server
and workers (as many as you\'d like to):

```shell
$ nix-shell --run "rabbitmq-server"
$ nix-shell --run "python3 server.py"
$ nix-shell --run "python3 worker.py"
$ nix-shell --run "python3 worker.py"
$ nix-shell --run "python3 worker.py"
```

Then then watch requests getting nicely balanced between all the
workers:

```shell
$ ab -n 1000 -c 100 http://localhost:8080/
```

You can also follow requests through RabbitMQ\'s management view at
`http://localhost:15672` (user: guest, password: guest).

If you\'d like to develop the project with IDE, just persist the
environment with:

```shell
$ nix-build
```

And point your IDE (e.g. PyCharm) to use the Python interpreter created
into `./result/bin/python3`.

As an extra, there\'s an alternative environment with pre-configured
supervisord:

```shell
$ nix-shell supervisord.nix
[nix-shell]$ supervisord
[nix-shell]$ supervisorctl status
rabbitmq                         RUNNING   pid 17683, uptime 0:00:01
server                           RUNNING   pid 17684, uptime 0:00:01
worker:worker-0                  RUNNING   pid 17682, uptime 0:00:01
worker:worker-1                  RUNNING   pid 17681, uptime 0:00:01
[nix-shell]$ supervisorctl shutdown
Shut down
[nix-shell]$ exit
```

More information
----------------

Nix manual, <https://nixos.org/nix/>

:   The official generic Nix manual for installing Nix, learning its
    built-in commands and the Nix language

Nixpkgs manual, <https://nixos.org/nixpkgs/>

:   The Nixpkgs manual for learning conventions and utilities provided
    in the Nix package collection (Nixpkgs)

Nix planet, <http://planet.nixos.org/>

:   Planet for Nix community bloggers

Nixpills, <http://lethalman.blogspot.fi/search/label/nixpills>

:   Famous blog series for learning how Nix really works in depth

Nix Conf, <http://conf.nixos.org/>

:   The first Nix conference site, hopefully hosting slides and links to
    recordings after the conference\...

`#nixos`

:   The Nix, Nixpkgs and NixOS community IRC channel at Freenode

`##nix-darwin`

:   The Nix Darwin (OS X) user community IRC channel at Freenode
