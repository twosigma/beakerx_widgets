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


class SingleSparkSessionMock(SingleSparkSession):

    def __init__(self) -> None:
        super().__init__()


def display_func_mock(spark_ui):
    pass


class SparkEngineMock(SparkEngine):
    def getOrCreate(self):
        pass

    def spark_app_id(self):
        pass

    def get_ui_web_url(self):
        return 'SparkUiWebUrl1'

    def stop(self):
        pass

    def configure_listeners(self, engine, server):
        pass

    def get_user_spark_config(self):
        return {}


class BeakerxSparkServerFactoryMock:
    def run_new_instance(self, spark_session):
        pass


class IpythonManagerMock:

    def configure(self, spark_context):
        pass
