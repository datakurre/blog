---
title: Stateless Nix environments revisited
date: "2015-07-07T06:00:00Z"
tags: ["nix"]
---

It\'s almost a year, since I tried to bend [Nix](http://nixos.org/nix/)
package manager to fit my own workflows for the first time. I disliked
the recommended way of describing *nix environments* in global
configuration and activating and deactivating them in statefull way.
Back then, I worked my way around by [defining a wrapper to make local
nix-expressions callable
executables](http://datakurre.pandala.org/2014/09/nix-expressions-as-executable-commands.html).

Consider that deprecated.

Nix 1.9 introduced [shebang support to use Nix-built interpreter in
callable scripts](http://nixos.org/nix/manual/#ssec-nix-shell-shebang).
**This alone** is a major new feature and **solves most of my use
cases**, where I wanted to define required Nix-dependencies locally, as
close to their usage as possible.

Still, I do have a one more use case: For example, want to run `make`
with an environment, which has locally defined Nix-built dependencies.
Because the make in this particular example results just a static PDF
file, it does not make sense to make that project into a Nix derivation
itself. (Neither does it make much sense to make Makefile an
executable.)

Of course, I start with defining my dependencies into a Nix derivation,
and to make that more convenient with `nix-shell`, I save that into a
file called `./default.nix`:

    with import <nixpkgs> {}; {
      myEnv = stdenv.mkDerivation {
        name = "myEnv";
        buildInputs = [
          (texLiveAggregationFun { paths = [
            texLive
            texLiveAuctex
            texLiveExtra
            texLivePGF
          ];})
          (rWrapper.override { packages = with rPackages; [
            tikzDevice
          ];})
          dot2tex
          gnumake
          graphviz
          pythonPackages.dateutil
          pythonPackages.matplotlib
          pythonPackages.numpy
          pythonPackages.scipy
        ];
      };
    }

Now, I can run make in that environment in a stateless manner with:

```shell
$ nix-shell --pure --run "make clean all"
```

Unfortunately, while that works, it\'s a bit long command to type every
time.

Initially, I would have preferred to be able to define local callable
script named `./make`, which was possible with my old approach. Yet,
this time I realized, that I can reach almost the same result by
defining the following bash function to help:

    function nix() { echo nix-shell --pure --run \"$@\" | sh; }

or with a garbage collection root to avoid re-evaluation the expression
on every call:

    function nix() {
        if [ ! -e shell.drv ]; then
            nix-instantiate --indirect --add-root $PWD/shell.drv
        fi
        echo nix-shell $PWD/shell.drv --pure --run \"$@\" | sh;
    }

With this helper in place, I can run any command from the locally
defined `default.nix` with simply:

```shell
$ nix make clean all
```
