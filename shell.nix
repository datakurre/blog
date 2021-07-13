{ pkgs ? import ./nix {}
}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    bindfs
    chromium
    nix
    gnumake
    nodejs-14_x
    node2nix
    entr
    fd
  ];
  shellHook = ''
    export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
  '';
}
