# Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

'''Installs BeakerX Widgets into a Jupyter and Python environment.'''

import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys
from distutils import log

import pkg_resources
from jupyter_core import paths
from traitlets.config.manager import BaseJSONConfigManager


def _base_classpath_for(kernel):
    return pkg_resources.resource_filename(
        'beakerx', os.path.join('kernel', kernel))


def _classpath_for(kernel):
    return pkg_resources.resource_filename(
        'beakerx', os.path.join('kernel', kernel, 'lib', '*'))


def _copy_tree(src, dst):
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def _install_magics():
    log.info("installing groovy magic for python...")
    dir_path = os.path.join(sys.prefix, 'etc', 'ipython')
    os.makedirs(dir_path, exist_ok=True)
    with open(os.path.join(dir_path, 'ipython_config.py'), 'w+') as ipython_config:
        ipython_config.write("c = get_config()\n")
        ipython_config.write("c.InteractiveShellApp.extensions = ["
                             "'beakerx.magics.kernel_magic',\n"
                             "'beakerx.magics.groovy_magic',\n"
                             "'beakerx.magics.clojure_magic',\n"
                             "'beakerx.magics.sparkex_magic',\n"
                             "'beakerx.magics.kotlin_magic',\n"
                             "'beakerx.magics.scala_magic',\n"
                             "'beakerx.magics.sql_magic',\n"
                             "'beakerx.magics.java_magic',\n"
                             "'beakerx.magics.kernel_runner_magic'\n"
                             "]\n")


def _set_conf_privileges():
    config_path = os.path.join(paths.jupyter_config_dir(), 'beakerx.json')
    if pathlib.Path(config_path).exists():
        os.chmod(config_path, 0o600)


def _pretty(it):
    return json.dumps(it, indent=2)


def _install_kernelspec_manager(prefix, disable=False):
    CKSM = "beakerx.kernel_spec.BeakerXKernelSpec"
    KSMC = "kernel_spec_class"

    action_prefix = "Dis" if disable else "En"
    log.info("{}abling BeakerX server config...".format(action_prefix))
    path = os.path.join(prefix, "etc", "jupyter")
    if not os.path.exists(path):
        log.debug("Making directory {}...".format(path))
        os.makedirs(path)
    cm = BaseJSONConfigManager(config_dir=path)
    cfg = cm.get("jupyter_notebook_config")
    log.debug("Existing config in {}...\n{}".format(path, _pretty(cfg)))
    nb_app = cfg.setdefault("KernelSpecManager", {})
    if disable and nb_app.get(KSMC, None) == CKSM:
        nb_app.pop(KSMC)
    elif not disable:
        nb_app.update({KSMC: CKSM})

    log.debug("Writing config in {}...".format(path))
    cm.set("jupyter_notebook_config", cfg)
    cfg = cm.get("jupyter_notebook_config")

    log.debug("Verifying config in {}...\n{}".format(path, _pretty(cfg)))
    if disable:
        assert KSMC not in cfg["KernelSpecManager"]
    else:
        assert cfg["KernelSpecManager"][KSMC] == CKSM

    log.info("{}abled BeakerX server config".format(action_prefix))


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prefix",
                        help="location of the environment to install into",
                        default=sys.prefix)
    parser.add_argument("--disable",
                        help="Remove Beakerx extension",
                        action='store_true')
    return parser


def install(args):
    if sys.platform == 'win32':
        subprocess.check_call(["jupyter", "nbextension", "install", "beakerx", "--py", "--sys-prefix"])
    else:
        subprocess.check_call(["jupyter", "nbextension", "install", "beakerx", "--py", "--symlink", "--sys-prefix"])
    subprocess.check_call(["jupyter", "nbextension", "enable", "beakerx", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "serverextension", "enable", "beakerx", "--py", "--sys-prefix"])
    if args.lab:
        subprocess.call(["jupyter", "labextension", "install", "@jupyter-widgets/jupyterlab-manager", "--no-build"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.check_call(["jupyter", "labextension", "install", "@beakerx/beakerx-widgets"])

    _install_kernelspec_manager(args.prefix)
    _install_magics()
    _set_conf_privileges()


def uninstall(args):
    subprocess.check_call(["jupyter", "nbextension", "disable", "beakerx", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "nbextension", "uninstall", "beakerx", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "serverextension", "disable", "beakerx", "--py", "--sys-prefix"])
    subprocess.check(["jupyter", "labextension", "uninstall", "@beakerx/beakerx-widgets"],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    _install_kernelspec_manager(args.prefix, disable=True)


if __name__ == "__main__":
    install()
