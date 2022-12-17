all: nix-publish

.PHONY: build
build: init
	gatsby build

.PHONY: publish
publish: build
	git add public
	git commit -m `git rev-parse HEAD^` public
	git push origin `git subtree split --prefix public master`:gh-pages --force
	git subtree split --prefix public -b gh-pages
	git reset --hard HEAD^
	mkdir -p public
	git --work-tree=`pwd`/public checkout gh-pages -- .
	git restore --staged .

.PHONY: shell
shell: init
	nix develop

.PHONY: watch
watch: init
	gatsby develop

###

nix-%:
	nix develop --command $(MAKE) $*

.PHONY: init
init:
	if [ -d public ]; then chmod u+w -R public; fi
