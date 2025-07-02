{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixos-23.11.tar.gz") {} }:

pkgs.mkShell {
  # The dev environment's dependencies.
  buildInputs = [
    pkgs.nodejs_20
    pkgs.openssh
  ];
}
