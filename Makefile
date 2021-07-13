CACHIX_CACHE = datakurre
SHELL := /usr/bin/env bash
export PATH := node_modules/.bin:$(PATH)

.PHONY: cache
cache:
	nix-store --query --references $$(nix-instantiate shell.nix) --references $$(nix-instantiate default.nix -A node_modules) | \
	xargs nix-store --realise | xargs nix-store --query --requisites | cachix push $(CACHIX_CACHE)

package-lock.json: package.json
	npm install --package-lock-only

nix/node-composition.nix: package-lock.json
	rm -rf node_modules
	node2nix --development --nodejs-14 -l package-lock.json --output nix/node-packages.nix --node-env nix/node-env.nix --composition nix/node-composition.nix
#sed -i "s|homepage = ./;||g" nix/node-packages.nix
