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

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as _ from 'underscore';
import $ from 'jquery';
import { PlotLayout } from './plotsrc/PlotLayout';
import { PlotScope } from './plotsrc/PlotScope';
import { CombinedPlotScope } from './plotsrc/CombinedPlotScope';
import { DOMWidgetModel, DOMWidgetView } from '@jupyter-widgets/base';
import { BEAKERX_MODULE_VERSION } from '../version';

const OUTPUT_POINTS_LIMIT = 1000000;
const OUTPUT_POINTS_PREVIEW_NUMBER = 10000;

type PlotModelType = any;

export class PlotModel extends DOMWidgetModel {
  defaults(): any {
    return {
      ...super.defaults(),
      _model_name: 'PlotModel',
      _view_name: 'PlotView',
      _model_module: 'beakerx.plots',
      _view_module: 'beakerx.plots',
      _model_module_version: BEAKERX_MODULE_VERSION,
      _view_module_version: BEAKERX_MODULE_VERSION,
    };
  }
}

export class PlotView extends DOMWidgetView {
  private _currentScope: any;

  render(): void {
    this._currentScope = null;

    this.displayed.then(() => {
      const plotModel = this.model.get('model');
      const type = plotModel.type || 'Text';

      this.limitPoints(plotModel);

      switch (type) {
        case 'CombinedPlot':
          this.initCombinedPlot(plotModel);
          break;
        default:
          this.initStandardPlot(plotModel);
          break;
      }

      this.listenTo(this.model, 'change:updateData', this.handleUpdateData);
      this.listenTo(this.model, 'change:model', this.handleModelUpdate);
      this.listenTo(this.model, 'beakerx-tabSelected', () => {
        this._currentScope.adjustModelWidth();
      });

      this.on('remove', () => {
        if (this._currentScope instanceof CombinedPlotScope) {
          this._currentScope.scopes.forEach(function (scope) {
            scope.destroy();
          });
        } else if (this._currentScope) {
          this._currentScope.destroy();
        }
        setTimeout(() => {
          this._currentScope = null;
        });
      });
    });
  }

  getNumberOfPointsForPlot(plotModel: PlotModelType): number {
    switch (plotModel.type) {
      case 'Histogram':
        return Math.max.apply(
          null,
          plotModel.graphics_list.map((graphic) => {
            return graphic.length;
          }),
        );
      default:
        return Math.max.apply(
          null,
          plotModel.graphics_list.map((graphic) => {
            const points = graphic.x ? graphic.x : graphic.y;

            return points ? points.length : 0;
          }),
        );
    }
  }

  truncatePointsForPlot(plotModel: PlotModelType): void {
    switch (plotModel.type) {
      case 'Histogram':
        for (let graphic of plotModel.graphics_list) {
          graphic = graphic.slice(0, OUTPUT_POINTS_PREVIEW_NUMBER);
        }
        break;
      default:
        for (const graphic of plotModel.graphics_list) {
          if (graphic.x && graphic.y) {
            graphic.x = graphic.x.slice(0, OUTPUT_POINTS_PREVIEW_NUMBER);
            graphic.y = graphic.y.slice(0, OUTPUT_POINTS_PREVIEW_NUMBER);
          }
        }
    }
  }

  limitPoints(plotModel: PlotModelType): void {
    let numberOfPoints;

    if (!_.isArray(plotModel.graphics_list)) {
      return;
    }

    if (!plotModel.plots) {
      numberOfPoints = this.getNumberOfPointsForPlot(plotModel);
      this.limitPointsForPlot(plotModel, numberOfPoints);

      return;
    }

    numberOfPoints = Math.max.apply(plotModel.plots.map(this.getNumberOfPointsForPlot));
    plotModel.plots.forEach((standardPlotModel) => {
      this.limitPointsForPlot(standardPlotModel, numberOfPoints);
    });
  }

  limitPointsForPlot(plotModel: PlotModelType, numberOfPoints: number): void {
    this.truncatePointsForPlot(plotModel);

    plotModel.numberOfPoints = numberOfPoints;
    plotModel.outputPointsLimit = OUTPUT_POINTS_LIMIT;
    plotModel.outputPointsPreviewNumber = OUTPUT_POINTS_PREVIEW_NUMBER;
  }

  handleModelUpdate(): void {
    const newModel = this.model.get('model');
    this._currentScope.updateModelData && this._currentScope.updateModelData(newModel);
    this._currentScope.updatePlot();
  }

  handleUpdateData(): void {
    const change = this.model.get('updateData');
    const currentModel = this.model.get('model');
    const updatedModel = _.extend(currentModel, change);
    this.model.set('model', updatedModel, { updated_view: this });
    this.handleModelUpdate();
  }

  initStandardPlot(model: PlotModelType): void {
    const wrapperId = `wrap_${this.model.model_id}`;
    this._currentScope = new PlotScope(wrapperId);
    const tmpl = PlotLayout.buildTemplate(wrapperId);
    const tmplElement = $(tmpl);

    tmplElement.appendTo(this.$el);

    this._currentScope.setWidgetModel(this.model);
    this._currentScope.setElement(tmplElement.children('.dtcontainer'));
    this._currentScope.setModelData(model);
    this._currentScope.setWidgetView(this);
    this._currentScope.init(this.model);
  }

  initCombinedPlot(model: PlotModelType): void {
    this._currentScope = new CombinedPlotScope(`wrap_${this.id}`);
    const tmpl = this._currentScope.buildTemplate();
    const tmplElement = $(tmpl);

    tmplElement.appendTo(this.$el);

    this._currentScope.setModelData(model);
    this._currentScope.setElement(tmplElement);
    this._currentScope.setWidgetView(this);
    this._currentScope.init(this.model);
  }
}
