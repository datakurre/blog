---
title: Building Docker containers from scratch using Nix
date: "2015-07-09T06:00:00Z"
tags: ["buildout", "docker", "nix", "plone"]
---

[Nix](https://nixos.org/nix/) makes it reasonable to build Docker
containers from scratch. The resulting containers are still big (yet I
heard there\'s ongoing work to make Nix builds more lean), but at least
you don\'t need to think about choosing and keeping the base images up
to date.

Next follows an example, how to make a Docker image for
[Plone](https://nixos.org/nix/) with Nix.

Creating Nix expression with collective.recipe.nix
--------------------------------------------------

At first, we need Nix expression for Plone. Here I use one built with
[my buildout based
generator](http://datakurre.pandala.org/2015/07/creating-nix-expressions-with-buildout.html),
[collective.recipe.nix](https://pypi.python.org/pypi/collective.recipe.nix).
It generates a few exression, including `plone.nix` and `plone-env.nix`.
The first one is only really usable with `nix-shell`, but the other one
can be used building a standalone Plone for Docker image.

To create `./plone-env.nix`, I need a buildout environment in
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

And a minimal Plone buildout using my recipe in `./buildout.cfg`:

```properties
[buildout]
extends = https://dist.plone.org/release/4-latest/versions.cfg
parts = plone
versions = versions

[instance]
recipe = plone.recipe.zope2instance
eggs = Plone
user = admin:admin

[plone]
recipe = collective.recipe.nix
eggs =
    ${instance:eggs}
    plone.recipe.zope2instance

[versions]
zc.buildout =
setuptools =
```

And finally produce both `plone.nix` and the required `plone-env.nix`
with:

```shell
$ nix-shell --run buildout
```

Creating Docker container with Nix Docker buildpack
---------------------------------------------------

Next up is building the container with our Nix expression with the help
of a builder container, which I call [Nix Docker
buildpack](https://github.com/datakurre/nix-build-pack-docker).

At first, we need to clone that:

```shell
$ git clone https://github.com/datakurre/nix-build-pack-docker
$ cd nix-build-pack-docker
```

And build the builder:

```shell
$ cd builder
$ docker build -t nix-build-pack --rm=true --force-rm=true --no-cache=true .
$ cd ..
```

Now the builder can be used to build a tarball, which only contains the
built Nix derivation Plone. Let\'s copy the created `plone-env.nix` into
the current working directory and run:

```shell
$ docker run --rm -v `pwd`:/opt nix-build-pack /opt/plone-env.nix
```

After a while, that directory should contain file called
`plone-env.nix.tar.gz`, which only contains two directories in its root:
`/nix` for the built derivation and `/app` for easy access symlinks,
like `/app/bin/python`.

Now we need `./Dockerfile` for building the final Plone image:

    FROM scratch
    ADD plone.env.nix.tar.gz /
    EXPOSE 8080
    USER 1000
    ENTRYPOINT ["/app/bin/python"]

And finally, a Plone image can be built with

```shell
$ docker build -t plone --rm=true --force-rm=true --no-cache=true .
```

Running Nix-built Plone container
---------------------------------

To run Plone in a container with the image built above, we still need
the configuration for Plone. We can the normal buildout generated
configuration, but we need to

1.  remove site.py from `parts/instance`.
2.  fix paths to match in `parts/instance/zope.conf` to match the
    mounted paths in Docker container (`/opt/...`)
3.  create some temporary directory to be mounted into container

Also, we need a small wrapper to call the Plone instance script,
`./instance.py`, because we cannot use the buildout generated one:

```python
import sys
import plone.recipe.zope2instance.ctl

sys.exit(plone.recipe.zope2instance.ctl.main(
    ['-C', '/opt/parts/instance/etc/zope.conf']
    + sys.argv[1:]
))
```

When these are in place, within the buildout directory, we should now be
able to run Plone in Docker container with:

```shell
$ docker run --rm -v `pwd`:/opt -v `pwd`/tmp:/tmp -P plone /opt/instance.py fg
```

The current working directory is mapped to `/opt` and some temporary
directory is mapped to `/tmp` (because our image didn\'t contain even a
[/tmp]{.title-ref}).

Note: When I tried this out, for some reason (possibly because
VirtualBox mount with boot2docker), I had to remove
`./var/filestorage/Data.fs.tmp` between runs or I got errors on ZODB
writes.
