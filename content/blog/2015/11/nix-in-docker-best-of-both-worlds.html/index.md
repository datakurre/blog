---
title: Nix in Docker – Best of Both Worlds
date: "2015-11-16T06:00:00Z"
tags: ["Jupyter", "Nix"]
---

I\'m using [Nix](https://nixos.org/nix/) mostly on a mac as a
development tool, and every now and then I get blocked by some packages
not working on OS X.

For those situations I\'ve been working for my own Nix image for Docker:
A such minimal Docker image that it only contains the files from the Nix
installer, but could re-use persistent shared Nix-installation between
Docker containers to make itself fast, convenient and lean.

My build recipe is now available at:

-   <https://gist.github.com/datakurre/a5d95794ce73c28f6d2f>

Features:

-   A single Docker image, which can be used to run anything from
    nixpkgs.
-   You can `nix-shell -p` to get a Docker isolated development shell
    with all your requirements installed from nixpkgs.
-   You can `-v /my/path:/var/nixpkgs` to use your own nixpkgs clone.
-   You can `-v /my/path:/etc/nix` to use your own nix configuration.
-   With the shared data container:
    -   Sequential and simultaneous containers can share the same Nix
        installation.
    -   You can `nix-env -i` to add new commands (or manage custom
        profiles).
    -   You can `nix-collect-garbage -d` to clean up the data container.
-   You can use it as a base image and add new stuff with `nix-env -i`.

Bootstrapping
-------------

Build a Docker image named *nix* using the provided Docker based build
chain:

```shell
$ git clone https://gist.github.com/datakurre/a5d95794ce73c28f6d2f
$ cd a5d95794ce73c28f6d2f
$ make
```

Create a Docker data container named *nix* to use a shared persistent
`/nix` for all your Nix containers:

```
$ docker create --name nix -v /nix nix sh
```

To know more about where the nix data gets stored with this setup,
please, read Docker documentation about [managing data in
containers](https://docs.docker.com/engine/userguide/dockervolumes/).

Examples of use
---------------

Running a Python interpreter with some packages:

```shell
$ docker run --rm --volumes-from=nix -ti nix \
         nix-shell -p python35Packages.pyramid --run python3
```

Running a Python Jupyter notebook with mounted context:

```shell
$ mkdir .jupyter
$ echo "c.NotebookApp.ip = '*'" > .jupyter/jupyter_notebook_config.py
$ docker run --rm --volumes-from=nix -ti \
         -v $PWD:/mnt -w /mnt -e HOME=/mnt -p 8888 nix \
         nix-shell -p python35Packages.notebook --run "jupyter notebook"
```

Running a Haskell Jupyter notebook with mounted context:

```shell
$ mkdir .jupyter
$ echo "c.NotebookApp.ip = '*'" > .jupyter/jupyter_notebook_config.py
$ docker run --rm --volumes-from=nix -ti \
         -v $PWD:/mnt -w /mnt -e HOME=/mnt -p 8888 nix \
         nix-shell -p ihaskell --run "ihaskell-notebook"
```

Running development shell for `default.nix` in mounted context:

Adding `--help` for nix-commands:

```shell
$ docker run --rm --volumes-from=nix nix nix-env -i man
$ docker run --rm --volumes-from=nix nix nix-env --help
```

Purging nix-store cache:

```shell
$ docker run --rm --volumes-from=nix nix nix-collect-garbage -d
```

Using the image as a base for a new Docker image, with `./Dockerfile`:

```Dockerfile
FROM nix
RUN nix-env -i python
ENTRYPOINT ["/usr/local/bin/python"]
```

```shell
$ docker build -t python --rm=true --force-rm=true --no-cache=true .
$ docker run --rm -ti python
```
