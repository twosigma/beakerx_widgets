# Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
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

from beakerx.magics.sparkex_magic import SingleSparkSession
from beakerx.spark.spark_engine import SparkEngine
from ipykernel.comm import Comm


class SingleSparkSessionMock(SingleSparkSession):

    def __init__(self) -> None:
        super().__init__()


class CommMock(Comm):

    def __init__(self):
        self.message = None

    def send(self, *args, **kwargs):
        self.message = kwargs["data"]


class BuilderMock:

    def __init__(self):
        self._options = {}

    def getOrCreate(self):
        return SparkSessionMock()

    def config(self, key=None, value=None, conf=None):
        pass


class SparkEngineMock(SparkEngine):

    def __init__(self, builder, single_spark_session, spark_session_factory):
        super().__init__(builder, single_spark_session, spark_session_factory)
        self.sparkui = None

    def spark_app_id(self):
        return 'appIdLocal1'

    def configure_listeners(self, sparkui, server):
        self.sparkui = sparkui

    def get_user_spark_config(self):
        return {
            "prop_1": "user_value_1"
        }

    def getOrCreate(self):
        return {}

    def stop(self):
        self.sparkui.end_application()

    def get_ui_web_url(self):
        return 'SparkUiWebUrl1'


class SparkSessionMock:
    def __init__(self):
        pass

    @property
    def sparkContext(self):
        return SparkContextMock()


class SparkContextMock:
    def __init__(self):
        pass

    def stop(self):
        pass


class IpythonManagerMock:

    def __init__(self):
        pass

    def configure(self, spark):
        pass


class SparkServerFactoryMock:

    def __init__(self):
        pass

    def run_new_instance(self, spark_context):
        pass


class ProfileMock:
    err = None

    def __init__(self):
        self.spark_options = {
            "current_profile": "",
            "profiles": [
                {
                    "name": "",
                    "prop_1": "init_value_1"
                }
            ]
        }

    def save(self, content):
        self.spark_options["profiles"] = content
        return True, ProfileMock.err

    def load_profiles(self):
        return self.spark_options, ProfileMock.err

    def save_current_profile(self, current_profile):
        self.spark_options["current_profile"] = current_profile
        return True, ProfileMock.err


class SparkSessionFactoryMock:
    def builder(self):
        return BuilderMock()


class SparkStateProgressUiManagerMock:
    def __init__(self, engine):
        self.engine = engine
