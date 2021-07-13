{ pkgs ? import ../../nix { nixpkgs = sources."nixpkgs-20.09"; }
, sources ? import ../../nix/sources.nix
, app ? import ./default.nix { inherit pkgs; }
, name ? "artifact"
}:

with pkgs;

let

  env = buildEnv {
    name = "env";
    paths = [
      bashInteractive
      coreutils
      app
    ];
  };

  closure = (writeReferencesToFile env);

in

runCommand name {
  buildInputs = [ makeWrapper ];
} ''
mkdir -p local/bin
makeWrapper ${bashInteractive}/bin/sh local/bin/sh \
  --prefix PATH : ${coreutils}/bin \
  --prefix PATH : ${app}/bin
tar czvhP \
  --hard-dereference \
  --exclude="${env}" \
  --exclude="*ncurses*/ncurses*/ncurses*" \
  --files-from=${closure} \
  --transform="s|^local/||" \
  local > $out || true
''
