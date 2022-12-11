all: build
build: init
	nix develop --command gatsby build
shell: init
	nix develop
watch: init
	nix develop --command gatsby develop

###

.PHONY: init
init:
	if [ -d public ]; then chmod u+w -R public; fi
