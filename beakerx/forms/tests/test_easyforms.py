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
from unittest.mock import MagicMock

from beakerx.forms.easyforms import EasyForm
from beakerx_base import BeakerxText, BeakerxPassword, BeakerxTextArea, BeakerxButton


class TestEasyForms(unittest.TestCase):

    def test_easyforms(self):
        # given
        # when
        ef = EasyForm()
        # then
        self.assertEqual(ef.easyFormName, "")
        self.assertEqual(len(ef.children), 0)
        self.assertEqual(len(ef.components), 0)

    def test_easyform_name(self):
        # given
        # when
        ef = EasyForm("Hello EasyForm!")
        # then
        self.assertEqual(ef.easyFormName, "Hello EasyForm!")

    def test_easyform_add_text_field(self):
        # given
        ef = EasyForm()
        # when
        ef.addTextField('first', width=10)
        ef['first'] = 'First'
        # then
        self.assertEqual(len(ef.children), 1)
        self.assertIsInstance(ef.children[0], BeakerxText)
        self.assertIn('first', ef.components)
        self.assertEqual(ef.components['first'].value, 'First')
        self.assertEqual(ef.components['first'].description, 'first')
        self.assertEqual(ef.components['first'].size, 10)

    def test_easyform_add_password_field(self):
        # given
        ef = EasyForm()
        # when
        ef.addPasswordField("Password Field", width=10)
        # then
        self.assertEqual(len(ef.children), 1)
        self.assertIsInstance(ef.children[0], BeakerxPassword)
        self.assertIn('Password Field', ef.components)
        p = ef.components['Password Field']
        self.assertEqual(p.description, 'Password Field')
        self.assertEqual(p.value, '')
        self.assertEqual(p.size, 10)

    def test_easyform_add_text_area(self):
        # given
        ef = EasyForm()
        # when
        ef.addTextArea("Text Area", width=10, height=5)
        # then
        self.assertEqual(len(ef.children), 1)
        self.assertIsInstance(ef.children[0], BeakerxTextArea)
        self.assertIn('Text Area', ef.components)
        ta = ef.components['Text Area']
        self.assertEqual(ta.description, 'Text Area')
        self.assertEqual(ta.value, '')
        self.assertEqual(ta.placeholder, '')
        self.assertEqual(ta.cols, 10)
        self.assertEqual(ta.rows, 5)

    def test_easyform_add_button(self):
        # given
        ef = EasyForm()
        # when
        b = ef.addButton('OK', tag='tag')
        b.actionPerformed = MagicMock()
        # then
        self.assertEqual(len(ef.children), 1)
        self.assertEqual(len(ef.components), 0)
        self.assertIsInstance(ef.children[0], BeakerxButton)
        b = ef.children[0]
        self.assertEqual(b.tag, 'tag')
        self.assertFalse(b.actionPerformed.called)
        b.click()
        self.assertTrue(b.actionPerformed.called)

    def test_easyform_add_list(self):
        # given
        ef = EasyForm()
        # when
        l1 = ef.addList('List 1', ["a", "b", "c"])
        l2 = ef.addList('List 2', ["a", "b", "c"], multi=False)
        l3 = ef.addList('List 3', ["a", "b", "c"], rows=2)
        # then
        print(ef.components.keys())
        self.assertEqual(len(ef.children), 3)
        print((l1, l2, l3))
