/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { version } from './version';
import {
  CyclingDisplayBoxModel,
  CyclingDisplayBoxView,
  GridView,
  GridViewModel,
  HTMLModel,
  HTMLPreModel,
  HTMLPreView,
  HTMLView,
  TabModel,
  TabView,
} from './output';
import {
  CheckboxModel, CheckboxView, ComboBoxModel, ComboBoxView, DatePickerModel, DatePickerView,
  EasyFormModel,
  EasyFormView,
  PasswordModel,
  PasswordView, SelectMultipleModel, SelectMultipleSingleModel, SelectMultipleSingleView, SelectMultipleView,
  TextAreaModel,
  TextAreaView,
  TextModel,
  TextView
} from './forms';
import {
  FoldoutModel,
  FoldoutView,
  RESTButtonModel,
  RESTButtonView,
  SparkConfigurationModel,
  SparkConfigurationView,
  SparkFoldoutModel,
  SparkFoldoutView,
  SparkStateProgressModel,
  SparkStateProgressView,
  SparkUIModel,
  SparkUIView,
  SpinnerModel,
  SpinnerView,
} from './spark';
import { PlotModel, PlotView } from './plots';

export const BeakexWidgetsFormsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'beakerx:plugin',
  requires: [IJupyterWidgetRegistry],
  activate: (app: JupyterFrontEnd, widgets: IJupyterWidgetRegistry): void => {
    console.log('beakerx.forms.plugin');
    widgets.registerWidget({
      name: 'beakerx',
      version: version,
      exports: {
        // output
        CyclingDisplayBoxModel,
        CyclingDisplayBoxView,
        GridViewModel,
        GridView,
        HTMLModel,
        HTMLView,
        HTMLPreModel,
        HTMLPreView,
        TabView,
        TabModel,
        // forms
        EasyFormModel,
        EasyFormView,
        CheckboxModel,
        CheckboxView,
        ComboBoxModel,
        ComboBoxView,
        DatePickerModel,
        DatePickerView,
        PasswordModel,
        PasswordView,
        SelectMultipleSingleModel,
        SelectMultipleSingleView,
        SelectMultipleModel,
        SelectMultipleView,
        TextModel,
        TextView,
        TextAreaModel,
        TextAreaView,
        // plot
        PlotModel,
        PlotView,
        // spark
        FoldoutModel,
        FoldoutView,
        RESTButtonModel,
        RESTButtonView,
        SpinnerModel,
        SpinnerView,
        SparkUIModel,
        SparkUIView,
        SparkStateProgressModel,
        SparkStateProgressView,
        SparkConfigurationModel,
        SparkConfigurationView,
        SparkFoldoutModel,
        SparkFoldoutView,
      },
    });
  },
  autoStart: true,
};

export default [BeakexWidgetsFormsPlugin] as JupyterFrontEndPlugin<any>[];
