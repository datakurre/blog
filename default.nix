{ pkgs ? import ./nix {}
, path_prefix ? ""
}:

let

  node_modules = (import ./nix/node-composition.nix { inherit pkgs; }).package.override {
    src = builtins.filterSource (path: type:
      (baseNameOf path) == "package.json" ||
      (baseNameOf path) == "gatsby-nixpkgs.patch" ||
      (baseNameOf path) == "package-lock.json" ) ./.;
    buildInputs = with pkgs; [
      pkgconfig
      autoconf  # for mozjpeg
      automake  # for mozjpeg
      libtool   # for mozjpeg
      nasm      # for mozjpeg
      glib.dev  # for sharp
      vips      # for sharp
    ];
    preRebuild = ''
      substituteInPlace node_modules/gatsby-remark-mermaid/index.js\
        --replace \
        "puppeteer.launch({" \
        "puppeteer.launch({executablePath: 'chromium', "
      ln -s "${pkgs.pngquant}/bin/pngquant" node_modules/pngquant-bin/vendor/pngquant
      patch -p1 < ./gatsby-nixpkgs.patch
    '';
    postInstall = ''
      mv $out/lib/node_modules/*/node_modules /tmp/_; rm -rf $out; mv /tmp/_ $out
    '';
    PUPPETEER_SKIP_DOWNLOAD = "true";
  };

in

pkgs.stdenv.mkDerivation {
  name = "gatsby-build";
  src = pkgs.lib.cleanSource ./.;
  buildPhase = ''
    source $stdenv/setup;
    cp -a ${node_modules} ./node_modules
    export PATH_PREFIX="${path_prefix}"
    HOME=$(pwd) node_modules/.bin/gatsby telemetry --disable
    HOME=$(pwd) node_modules/.bin/gatsby build --prefix-paths
  '';
  installPhase = ''
    cp -a public $out
  '';
  buildInputs = with pkgs; [
    bindfs
    nodejs-14_x
    node_modules
    chromium
  ];
  passthru = {
    inherit node_modules;
  };
  shellHook = ''
    fusermount -qu node_modules
    mkdir -p node_modules
    bindfs ${node_modules} node_modules -o nonempty
    export PATH=$(pwd)/node_modules/.bin:$PATH
  '';
}
