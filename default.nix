# Nix build that defines a reproducible environment for running the
# server.  You can use this as an easy way to jump into the dev
# environment without depending on any OS-level software packages.
#
# Requirements: nix must be installed; use "apt install nix-bin" or
# see https://nixos.org/ for more detailed options.
#
# Usage:
#
# To jump into a dev shell:
#   nix-shell
#
# To create a permanent shell for later use:
#   nix-build -o devshell
#
# Updating:
#   If yarn.lock or package.json get updated, the build will fail due
#   to missing packages or a mismatched hash in the defnition of
#   offlineCache below.  You can force it to display the new hash by
#   blanking out the existing one, then update the hash to the new
#   value to proceed. (Please submit a PR.)
#
# Note: this includes a dependency on a personal GitHub repository for
# the simple mkBuildableShell utility. If that URL ever breaks we
# could replace it with the less-functional mkShell or copy in the
# code from a backup somewhere.

let
  offlineCache = pkgs.fetchYarnDeps {
    inherit yarnLock;
    # Update this hash for a new yarn.lock.
    sha256 = "GyAf2MY4jex4rJakGXhbufOPNCWoX6u6zaByFfF8n2A=";
  };

  # nixos-25.11 from 2026-03-05:
  nixpkgs =
    let version = "fabb8c9deee281e50b1065002c9828f2cf7b2239";
    in fetchTarball {
      name = "nixpkgs-${version}";
      url = "https://github.com/NixOS/nixpkgs/archive/${version}.tar.gz";
      sha256 = "15gvdgdqsxjjihq1r66qz1q97mlcaq1jbpkhbx287r5py2vy38b1";
    };
  pkgs = (import nixpkgs {});

  # mkBuildableShell from 2026-04-11:
  mkBuildableShell-src =
    let version = "064d5a1bba6236314a14421fadb873195854b0b5";
    in fetchTarball {
      name = "mkBuildableShell-${version}";
      url = "https://github.com/pdg137/mkBuildableShell/archive/${version}.tar.gz";
      sha256 = "0dsk7anb6c5f9bd72dkzzzwi4mazdji25h4m9wfn2xfvkixns10i";
    };
  mkBuildableShell = (import mkBuildableShell-src pkgs);

  yarnLock = ./yarn.lock;
  packageJson = ./package.json;
  node = pkgs.nodejs_24;

  # This program "napi-postinstall" didn't work as expected fom a
  # post-install script of unrs-resolver, maybe because of
  # /usr/bin/env or because of just not being on the path correctly.
  # So we make an alias to fix it:
  napi-postinstall-alias = pkgs.writeShellScriptBin "napi-postinstall"
    ''exec ${node}/bin/node ../napi-postinstall/lib/cli.js "$@"'';

  node-modules = pkgs.stdenv.mkDerivation {
    name = "ogs-node-modules";

    dontUnpack = true;

    nativeBuildInputs = [
      pkgs.yarn
      pkgs.fixup-yarn-lock
      napi-postinstall-alias
    ];

    buildPhase = ''
      set -e

      # Use local setup for Yarn with internet access disabled.
      export HOME="$(mktemp -d)"
      yarn config --offline set yarn-offline-mirror ${offlineCache}

      cp ${yarnLock} ./yarn.lock
      cp ${packageJson} ./package.json
      chmod u+w ./yarn.lock
      fixup-yarn-lock yarn.lock

      yarn install --offline --frozen-lockfile \
                   --no-progress --non-interactive
    '';

    # Note: rollup seems to fail if the directory is not called
    # "node_modules", even behind a symlink.
    installPhase = ''
      set -eu
      mkdir -p $out
      mv node_modules $out
    '';
  };

in
mkBuildableShell {
  name = "shell";
  buildInputs = [ node pkgs.yarn ];

  shellHook = ''
    set -eu

    if [ -e node_modules ] && [ ! -L node_modules ]; then
      echo 'Existing ./node_modules directory found; remove before proceeding.'
      exit 1
    else
      echo 'Linking node_modules to Nix store...'
      rm -f ./node_modules
      ln -sf ${node-modules}/node_modules ./node_modules
    fi
    export OGS_LOCAL_VITE_CACHE=1

    echo 'Run "yarn run dev" to start the server.'
    set +eu
  '';
}
