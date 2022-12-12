---
title: Creating Nix-expressions with buildout
date: "2015-07-08T06:00:00Z"
tags: ["Buildout", "Nix", "Plone"]
---

The greatest blocker for using [Nix](https://nixos.org/nix/) or complex
Python projects like [Plone](https://plone.org/), I think, is the work
needed to make all required Python-packages (usally very specific
versions) available in nix expression. Also, in the most extreme, that
would require every version for every package in PyPI in
[nixpkgs](https://nixos.org/nixpkgs/).

Announcing collective.recipe.nix
--------------------------------

[collective.recipe.nix](https://github.com/datakurre/collective.recipe.nix)
is my try for generating nix expressions for arbitrary Python projects.
It\'s an experimental buildout recipe, which re-uses *zc.recipe.egg* for
figuring out all the required packages and their dependencies.

Example of usage
----------------

At first, bootstrap your environment by defining python with buildout in
`./default.nix`:

    with import <nixpkgs> {}; {
      myEnv = stdenv.mkDerivation {
        name = "myEnv";
        buildInputs = [
          pythonPackages.buildout
        ];
        shellHook = ''
          export SSL_CERT_FILE=~/.nix-profile/etc/ca-bundle.crt
        '';
      };
    }

And example `./buildout.cfg`:

```properties
[buildout]
parts =
    i18ndude
    releaser
    robot
    sphinx

[i18ndude]
recipe = collective.recipe.nix
eggs = i18ndude

[releaser]
recipe = collective.recipe.nix
eggs = zest.releaser[recommended]

[robot]
recipe = collective.recipe.nix
eggs = robotframework
propagated-build-inputs =
    robotframework=robotframework-debuglibrary
    robotframework=robotframework-selenium2library
    robotframework=robotframework-selenium2screenshots

[sphinx]
recipe = collective.recipe.nix
eggs = sphinx
propagated-build-inputs =
    sphinx=sphinxcontrib_robotframework[docs]
```

Run the buildout:

```shell
$ nix-shell --run buildout
```

The recipe generates three kind of expressions:

-   default \[name\].nix usable with nix-shell
-   buildEnv based \[name\]-env.nix usable with nix-build
-   buildPythonPackage based \[name\]-package.nix usable with nix-env -i
    -f

So, now you should be able to run zest.releaser with:

```shell
$ nix-shell releaser.nix --run fullrelease
```

You could also build Nix-environment with symlinks in folder
`./releaser` or [into a Docker
image](http://datakurre.pandala.org/2015/07/building-docker-containers-from-scratch.html)
with:

```shell
$ nix-build releaser-env.nix -o releaser
```

Finally, you could install zest.releaser into your current Nix-profile
with:

```shell
$ nix-env -i -f releaser-zest_releaser.nix
```
