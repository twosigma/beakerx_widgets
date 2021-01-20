/*
 *  Copyright 2018 TWO SIGMA OPEN SOURCE, LLC
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

import * as _ from 'underscore';
import { HeatmapConverter } from '../HeatmapConverter';
import { PlotConverter } from '../PlotConverter';

export abstract class AbstractPlotModel {
  model: any;
  settings: any;
  lineDasharrayMap = {
    solid: '',
    dash: '9,5',
    dot: '2,2',
    dashdot: '9,5,2,5',
    longdash: '20,5',
  };

  abstract format(newModel: any): void;

  abstract createNewModel(model: any): any;

  constructor(model, settings) {
    this.model = model;
    this.settings = settings;
  }

  getStandardizedModel(): any {
    return this.standardize(this.model, this.settings);
  }

  standardize(originalModel, settings): any {
    const model = { ...originalModel };

    if (model.graphics_list != null) {
      model.version = 'groovy'; // TODO, a hack now to check DS source
    }

    if (model.version === 'complete') {
      // skip standardized model in combined plot
      return model;
    }

    if (model.version !== 'groovy') {
      model.version = 'direct';
    }

    const newModel = this.createNewModel(model);

    newModel.lodThreshold = model.lodThreshold
      ? model.lodThreshold
      : settings && settings.lodThreshold !== undefined
      ? settings.lodThreshold
      : 4000;

    newModel.data = [];

    if (model.version === 'groovy') {
      switch (model.type) {
        case 'HeatMap':
          HeatmapConverter.convertGroovyData(newModel, model);
          break;
        default:
          PlotConverter.convertGroovyData(newModel, model);
          break;
      }
    } else {
      // DS generated directly
      _.extend(newModel, model);
    }

    this.format(newModel);

    newModel.version = 'complete';

    return newModel;
  }
}
