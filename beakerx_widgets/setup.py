#!/usr/bin/env python
# coding: utf-8

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

from os import path

from jupyter_packaging import (
    create_cmdclass, install_npm, ensure_targets,
    combine_commands, ensure_python,
    get_version
)

from setuptools import setup, find_packages

# The name of the project
name = 'beakerx'
npm_name = '@beakerx/beakerx-widgets'

HERE = path.dirname(path.abspath(__file__))

# Ensure a valid python version
ensure_python('>=3.6')

# Get our version
version = get_version(path.join(name, '_version.py'))

nb_path = path.join(HERE, name, 'static')
lab_path = path.join(HERE, name, 'labextension')

# Representative files that should exist after a successful build
jstargets = [
    path.join(nb_path, 'index.js'),
    path.join(lab_path, 'package.json'),
]

package_data_spec = {
    name: [
        'static/*',
        'labextension/*'
    ]
}

data_files_spec = [
    ('share/jupyter/nbextensions/beakerx', nb_path, '**'),
    ("share/jupyter/labextensions/" + npm_name, lab_path, "**"),
    ('etc/jupyter/nbconfig/notebook.d', HERE, 'beakerx.json')
]

cmdclass = create_cmdclass('js', package_data_spec=package_data_spec, data_files_spec=data_files_spec)
cmdclass['js'] = combine_commands(
    install_npm(
        path=path.join(HERE, 'js'),
        npm=["yarn"],
        build_cmd="build:labextension",
        build_dir=path.join(HERE, 'js', 'dist'),
        source_dir=path.join(HERE, 'js', 'src')
    ),
    ensure_targets(jstargets),
)

setup_args = dict(
    name=name,
    description='BeakerX: Beaker Extensions for Jupyter Notebook',
    long_description='BeakerX: Beaker Extensions for Jupyter Notebook',
    version=version,
    author='Two Sigma Open Source, LLC',
    author_email='beakerx-feedback@twosigma.com',
    url='http://beakerx.com',
    keywords=[
        'ipython',
        'jupyter',
        'widgets'
    ],
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Framework :: IPython',
        'Intended Audience :: Developers',
        'Intended Audience :: Science/Research',
        'Topic :: Multimedia :: Graphics',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7'
    ],
    entry_points={
        'console_scripts': [
            'beakerx = beakerx:run'
        ]
    },
    install_requires=[
        'beakerx_base>=2.0.1',
        'requests',
        'pandas',
        'bottle',
        'pyspark'
    ],
    python_requires='>=3',
    zip_safe=False,
    include_package_data=True,
    packages=find_packages(),
    cmdclass=cmdclass
)

if __name__ == '__main__':
    setup(**setup_args)
