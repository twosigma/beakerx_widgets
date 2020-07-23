# Copyright 2020 TWO SIGMA OPEN SOURCE, LLC
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

import json
import unittest

from IPython import InteractiveShell
from beakerx.magics.sparkex_magic import SparkexMagics
from beakerx.magics.tests.mocks import SparkEngineMock, IpythonManagerMock, BeakerxSparkServerFactoryMock, \
    display_func_mock
from beakerx.spark.spark_factory import SparkFactory
from beakerx.spark.sparkex import SparkUI
from beakerx.spark.tests.mocks import CommMock, SparkSessionFactoryMock


class TestSparkUI(unittest.TestCase):
    spark_widget = None

    def test_auto_connect_spark_default(self):
        result = self.spark_magic()
        self.assertTrue(result is None)
        self.assertFalse(TestSparkUI.spark_widget.engine.auto_start)

    def test_auto_connect_spark(self):
        result = self.spark_magic("--start")
        self.assertTrue(result is None)
        self.assertTrue(TestSparkUI.spark_widget.engine.auto_start)

    def spark_magic(self, option=""):
        ip = InteractiveShell.instance()
        ip.register_magics(SparkexMagicsForTests)
        code = " from pyspark.sql import SparkSession" \
               " \n SparkSession.builder.appName('abc')"
        result = ip.run_cell_magic("spark", option, code)
        return result


class SparkexMagicsForTests(SparkexMagics):

    def _create_spark_factory(self, builder, ipython_manager, server_factory, profile, options, display_func,
                              single_spark_session):
        factory = SparkFactoryMock(options,
                                   SparkEngineMock(builder, single_spark_session, SparkSessionFactoryMock()),
                                   IpythonManagerMock(),
                                   BeakerxSparkServerFactoryMock(),
                                   profile,
                                   display_func_mock)
        return factory


class SparkFactoryMock(SparkFactory):

    def _create_spark_ui(self):
        spark_widget = SparkUIMock(self.spark_engine,
                                   self.ipythonManager,
                                   self.server_factory,
                                   self.profile,
                                   CommMock())
        TestSparkUI.spark_widget = spark_widget
        return spark_widget


class SparkUIMock(SparkUI):
    def _get_init_profiles(self):
        profiles = json.loads('[]')
        return profiles, ""
