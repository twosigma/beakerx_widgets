# Copyright 2019 TWO SIGMA OPEN SOURCE, LLC
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

import socket

from bottle import Bottle, run


class BeakerxSparkServer:

    def __init__(self, spark_context):
        self.spark_context = spark_context
        self.app = Bottle()
        self.port = self.get_free_tcp_port()
        self.hostname = "http://localhost:" + str(self.port) + "/"
        self.jobGroup = "jobGroup" + str(self.port)
        self.spark_context.setJobGroup(self.jobGroup, self.jobGroup)
        self.app.route('/cancelledSparkJobs/<stageId>', method="POST", callback=self.cancelSparkJobs)
        self.app.route('/putSparkJobsInTheBackground', method="POST", callback=self.putSparkJobsInTheBackground)

    def get_free_tcp_port(self):
        tcp = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp.bind(('localhost', 0))
        addr, port = tcp.getsockname()
        tcp.close()
        return port

    def run(self):
        run(self.app, host='localhost', port=self.port, quiet=True)

    def getURL(self):
        return self.hostname

    def cancelSparkJobs(self, stageId):
        self.spark_context.cancelJobGroup(self.jobGroup)

    def putSparkJobsInTheBackground(self):
        pass
