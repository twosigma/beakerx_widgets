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

from beakerx.spark.sparkex import SparkUI
from beakerx.spark.tests.mocks import BuilderMock, SingleSparkSessionMock, SparkEngineMock, \
    SparkSessionFactoryMock, IpythonManagerMock, SparkServerFactoryMock, ProfileMock, CommMock


class TestSparkUI(unittest.TestCase):

    def test_should_load_profile_on_widget_creation(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython_manager = IpythonManagerMock()
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        # when
        sui = SparkUI(engine, ipython_manager, spark_server_factory, profile, CommMock())
        # then
        self.assertTrue(sui.profiles == [
            {
                "name": "",
                "prop_1": "init_value_1"
            }
        ])
        self.assertTrue(sui.current_profile == "")

    def test_should_create_spark_conf_based_on_user_conf_when_widget_creation(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython_manager = IpythonManagerMock()
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        # when
        sui = SparkUI(engine, ipython_manager, spark_server_factory, profile, CommMock())
        # then
        self.assertTrue(sui.user_spark_conf == {
            "name": "",
            "prop_1": "user_value_1"
        })

    def test_should_save_profiles(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython_manager = IpythonManagerMock()
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        sui = SparkUI(engine, ipython_manager, spark_server_factory, profile, CommMock())
        msg_save_profile = {
            "event": "save_profiles",
            "payload": [
                {
                    "spark.executor.memory": "8g",
                    "spark.master": "local[10]",
                    "name": "new_prof_1",
                    "spark.executor.cores": "10",
                    "properties": []
                }
            ]
        }
        # when
        sui.handle_msg(sui, msg_save_profile)
        # then
        result, err = profile.load_profiles()
        self.assertTrue(result["profiles"][0]["name"] == "new_prof_1")
        self.assertTrue(err is None)
        self.assertTrue(sui.comm.message["method"] == "update")
        event = sui.comm.message["event"]
        self.assertTrue(event["save_profiles"] == "done")

    def test_should_send_done_message_when_sc_stops(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython_manager = IpythonManagerMock()
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        sui = SparkUI(engine, ipython_manager, spark_server_factory, profile, CommMock())
        msg_start = self.create_msg_start()
        sui.handle_msg(sui, msg_start)
        msg_stop = {
            'event': 'stop'
        }
        # when
        sui.handle_msg(sui, msg_stop)
        # then
        self.assertTrue(sui.comm.message["method"] == "update")
        event = sui.comm.message["event"]
        self.assertTrue(event["stop"] == "done")

    def test_should_send_done_message_when_sc_starts(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython_manager = IpythonManagerMock()
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        sui = SparkUI(engine, ipython_manager, spark_server_factory, profile, CommMock())
        msg_start = self.create_msg_start()
        # when
        sui.handle_msg(sui, msg_start)
        # then
        self.assertTrue(sui.comm.message["method"] == "update")
        event = sui.comm.message["event"]
        self.assertTrue(event["start"] == "done")
        self.assertTrue(event["sparkAppId"] == "appIdLocal1")
        self.assertTrue(event["sparkUiWebUrl"] == "SparkUiWebUrl1")

    def create_msg_start(self):
        return {
            'event': 'start',
            'payload': {
                "current_profile": "profile1",
                "spark_options": {
                    'spark.executor.memory': '8g',
                    'spark.master': 'local[10]',
                    'properties': [
                        {
                            "name": "wwww",
                            "value": "wwwww"
                        }
                    ]
                }
            }
        }

    def test_should_save_current_profile_when_sc_starts(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython_manager = IpythonManagerMock()
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        sui = SparkUI(engine, ipython_manager, spark_server_factory, profile, CommMock())
        msg_start = {
            'event': 'start',
            'payload': {
                "current_profile": "profile1",
                "spark_options": {
                    'spark.executor.memory': '8g',
                    'spark.master': 'local[10]',
                    'properties': []
                }
            }
        }
        # when
        sui.handle_msg(sui, msg_start)
        # then
        self.assertTrue(profile.spark_options["current_profile"] == "profile1")

    def test_should_not_create_sc_when_builder_is_None(self):
        # given
        engine = None
        spark_server_factory = SparkServerFactoryMock()
        ipython = IpythonManagerMock()
        profile = ProfileMock()
        # when
        try:
            SparkUI(engine, ipython, spark_server_factory, profile)
            self.fail("builder is None")
        except Exception as err:
            self.assertTrue("value can not be None" in str(err), "Should not create SparkUI when builder is None")
        # then

    def test_should_not_create_sc_when_ipython_is_None(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        spark_server_factory = SparkServerFactoryMock()
        profile = ProfileMock()
        ipython = None
        # when
        try:
            SparkUI(engine, ipython, spark_server_factory, profile)
            self.fail("ipython is None")
        except Exception as err:
            self.assertTrue("value can not be None" in str(err), "Should not create SparkUI when ipython is None")
        # then

    def test_should_not_create_sc_when_factory_is_None(self):
        # given
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython = IpythonManagerMock()
        profile = ProfileMock()
        spark_server_factory = None
        # when
        try:
            SparkUI(engine, ipython, spark_server_factory, profile)
            self.fail("spark server factory is None")
        except Exception as err:
            self.assertTrue("value can not be None" in str(err), "Should not create SparkUI when factory is None")
        # then

    def test_should_create_sc(self):
        # given
        spark_server_factory = SparkServerFactoryMock()
        builder = BuilderMock()
        spark_session_mock = SingleSparkSessionMock()
        engine = SparkEngineMock(builder, spark_session_mock, SparkSessionFactoryMock())
        ipython = IpythonManagerMock()
        profile = ProfileMock()
        # when
        spark_ui = SparkUI(engine, ipython, spark_server_factory, profile, CommMock())
        # then
        self.assertTrue(spark_ui)
