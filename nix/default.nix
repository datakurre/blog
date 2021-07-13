# https://github.com/nmattia/niv
{ sources ? import ./sources.nix
, nixpkgs ? sources."nixpkgs"
}:

let

  overlay = _: pkgs: {

    gitignoreSource = (import sources.gitignore {
      inherit (pkgs) lib;
    }).gitignoreSource;

    node2nix = builtins.getAttr builtins.currentSystem (
      import (sources.node2nix + "/release.nix") {
        systems = [ builtins.currentSystem ];
        nixpkgs = sources."nixpkgs-20.09";
    }).package;

  };

  pkgs = import nixpkgs {
    overlays = [ overlay ];
    config = {};
  };

in pkgs
