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

import unittest

from beakerx.spark.spark_listener import SparkListener
from beakerx.spark.sparkex import SparkUI
from beakerx.spark.tests.mocks import BuilderMock, SingleSparkSessionMock, SparkEngineMock, \
    SparkStateProgressUiManagerMock, CommMock, IpythonManagerMock, SparkServerFactoryMock, ProfileMock, \
    SparkSessionFactoryMock


class TestSparkListener(unittest.TestCase):

    def test_should_inactivate_single_spark_session_when_application_end(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        engine.activate_spark_session()
        self.assertTrue(engine.is_active_spark_session())
        ipython_manager = IpythonManagerMock()
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        sparkUi = SparkUI(engine, ipython_manager, spark_server_factory, profile, CommMock())
        listener = SparkListener(sparkUi, SparkStateProgressUiManagerMock(engine))
        # when
        listener.onApplicationEnd(None)
        # then
        self.assertFalse(engine.is_active_spark_session())
