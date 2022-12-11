{
  description = "A GatsbyJS blog";

  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/release-22.11";
  inputs.npmlock2nix = { url = "github:nix-community/npmlock2nix"; flake = false; };

  outputs = { self, nixpkgs, flake-utils, npmlock2nix, ... }: flake-utils.lib.eachDefaultSystem (system: let pkgs = nixpkgs.legacyPackages.${system}; in {

    overlays = [
      (final: prev: {
        npmlock2nix = import npmlock2nix { pkgs = prev; };
      })
    ];

    devShells = let
      pkgs = import nixpkgs { inherit system; overlays = self.overlays.${system}; };
      inherit (pkgs) npmlock2nix;
    in {
      default = npmlock2nix.v2.shell {
        src = self;
        nodejs = pkgs.nodejs-18_x;
        buildInputs = [
          pkgs.chromium
        ];
        node_modules_attrs = {
          buildInputs = [
            pkgs.pkgconfig
            pkgs.python3
            pkgs.nodePackages.node-gyp
            pkgs.vips
          ];
          postBuild = ''
            # Fix sharp
            cd node_modules/sharp
            node-gyp rebuild
            cd ../..
            # Custom codemirror
            rm -rf node_modules/gatsby-remark-codemirror/node_modules/codemirror
            cp -a node_modules/codemirror node_modules/gatsby-remark-codemirror/node_modules
            # Patch gatsby-remark-mermaid 2.x
            substituteInPlace node_modules/gatsby-remark-mermaid/index.js --replace "puppeteer.launch({" "puppeteer.launch({executablePath: 'chromium', "
            # Patch GatsbyJS
            patch -p1 <${./gatsby-nixpkgs.patch}
          '';
          PUPPETEER_SKIP_DOWNLOAD = "true";
        };
      };
    };
  });
}
