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
import pkg_resources
import shutil
import subprocess
import sys
import pathlib

from jupyter_core import paths
from traitlets.config.manager import BaseJSONConfigManager
from distutils import log

def _base_classpath_for(kernel):
    return pkg_resources.resource_filename(
        'beakerx', os.path.join('kernel', kernel))


def _classpath_for(kernel):
    return pkg_resources.resource_filename(
        'beakerx', os.path.join('kernel', kernel, 'lib', '*'))


def _uninstall_nbextension():
    subprocess.check_call(["jupyter", "nbextension", "disable", "beakerx_widgets", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "nbextension", "uninstall", "beakerx_widgets", "--py", "--sys-prefix"])
    subprocess.check_call(["jupyter", "serverextension", "disable", "beakerx_widgets", "--py", "--sys-prefix"])


def _install_nbextension():
    if sys.platform == 'win32':
        subprocess.check_call(["jupyter", "nbextension", "install", "beakerx_widgets", "--py", "--sys-prefix"])
    else:
        subprocess.check_call(["jupyter", "nbextension", "install", "beakerx_widgets", "--py", "--symlink", "--sys-prefix"])

    subprocess.check_call(["jupyter", "nbextension", "enable", "beakerx_widgets", "--py", "--sys-prefix"])

    subprocess.check_call(["jupyter", "serverextension", "enable", "beakerx_widgets", "--py", "--sys-prefix"])


def _install_labextensions(lab):
    if lab:
        subprocess.check_call(["jupyter", "labextension", "install", "@jupyter-widgets/jupyterlab-manager"])
        subprocess.check_call(["jupyter", "labextension", "install", "beakerx-jupyterlab"])


def _uninstall_labextensions(lab):
    if lab:
        subprocess.check_call(["jupyter", "labextension", "uninstall", "beakerx-jupyterlab"])
        subprocess.check_call(["jupyter", "labextension", "uninstall", "@jupyter-widgets/jupyterlab-manager"])


def _install_tabledisplay(lab):
    if lab:
        subprocess.check_call(["beakerx_tabledisplay", "install", "--lab"])
    else:
        subprocess.check_call(["beakerx_tabledisplay", "install"])


def _uninstall_tabledisplay():
    subprocess.check_call(["beakerx_tabledisplay", "uninstall"])


def _copy_tree(src, dst):
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def _copy_icons():
    log.info("installing icons...")
    # kernels = KernelSpecManager().find_kernel_specs()
    # for kernel in _all_kernels():
    #     dst_base = kernels.get(kernel)
    #     src_base = _base_classpath_for(kernel)
    #     shutil.copyfile(os.path.join(src_base, 'logo-32x32.png'), os.path.join(dst_base, 'logo-32x32.png'))
    #     shutil.copyfile(os.path.join(src_base, 'logo-64x64.png'), os.path.join(dst_base, 'logo-64x64.png'))


def _install_css():
    log.info("installing custom CSS...")
    # resource = os.path.join('static', 'custom')
    # src_base = pkg_resources.resource_filename('beakerx_widgets', resource)
    # dst_base = pkg_resources.resource_filename('notebook', resource)
    # _copy_tree(os.path.join(src_base, 'fonts'), os.path.join(dst_base, 'fonts'))
    # shutil.copyfile(os.path.join(src_base, 'custom.css'), os.path.join(dst_base, 'custom.css'))


def _install_magics():
    log.info("installing groovy magic for python...")
    dir_path = os.path.join(sys.prefix, 'etc', 'ipython')
    os.makedirs(dir_path, exist_ok=True)
    with open(os.path.join(dir_path, 'ipython_config.py'), 'w+') as ipython_config:
        ipython_config.write("c = get_config()\n")
        ipython_config.write("c.InteractiveShellApp.extensions = ["
                             "'beakerx_widgets.magics.kernel_magic',\n"
                             "'beakerx_widgets.magics.groovy_magic',\n"
                             "'beakerx_widgets.magics.clojure_magic',\n"
                             "'beakerx_widgets.magics.sparkex_magic',\n"
                             "'beakerx_widgets.magics.kotlin_magic',\n"
                             "'beakerx_widgets.magics.scala_magic',\n"
                             "'beakerx_widgets.magics.sql_magic',\n"
                             "'beakerx_widgets.magics.java_magic',\n"
                             "'beakerx_widgets.magics.kernel_runner_magic'\n"
                             "]\n")

def _set_conf_privileges():
    config_path = os.path.join(paths.jupyter_config_dir(), 'beakerx.json')
    if pathlib.Path(config_path).exists():
        os.chmod(config_path, 0o600)


def _pretty(it):
    return json.dumps(it, indent=2)


def _install_kernelspec_manager(prefix, disable=False):
    CKSM = "beakerx_widgets.kernel_spec.BeakerXKernelSpec"
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


def _disable_beakerx(args):
    _uninstall_nbextension()
    _uninstall_labextensions(args.lab)
    _install_kernelspec_manager(args.prefix, disable=True)


def _install_beakerx(args):
    _install_nbextension()
    _install_labextensions(args.lab)
    _install_css()
    _copy_icons()
    _install_kernelspec_manager(args.prefix)
    _install_magics()
    _set_conf_privileges()


def install(args):
    _install_beakerx(args)

def uninstall(args):
    _disable_beakerx(args)


if __name__ == "__main__":
    install()
