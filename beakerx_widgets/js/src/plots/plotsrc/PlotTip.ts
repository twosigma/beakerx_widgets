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

import * as _ from 'underscore';
import * as d3 from 'd3';
import $ from 'jquery';
import { PlotStyleUtils, PlotUtils } from '../../utils';

export class PlotTip {
  static readonly TOOLTIP_ANIMATION_TIME = 300;

  static renderTips(scope): void {
    const data = scope.stdmodel.data;
    const svg = scope.maing;

    svg.selectAll('.plot-tooltip-line').remove();

    _.each(scope.tips, (d, key) => {
      PlotTip.renderTip(scope, d, key, data);
    });
  }

  static renderTip(scope, d, key, data): void {
    if (!Object.prototype.hasOwnProperty.call(scope.tips, key)) {
      return;
    }

    const x = scope.plotRange.data2scrX(d.datax);
    const y = scope.plotRange.data2scrY(d.datay);

    d.scrx = x;
    d.scry = y;

    let tipdiv = PlotTip.getTipElement(scope, d);

    if (tipdiv.length === 0) {
      tipdiv = PlotTip.addTipDivElement(scope, d, key, data);
    }

    const w = tipdiv.outerWidth();
    const h = tipdiv.outerHeight();

    if (d.hidden === true || PlotTip.outsideGrid(scope, x, y, w, h)) {
      PlotTip.clear(scope, d);
      tipdiv.remove();

      return;
    }

    const drag = (e, ui) => {
      d.scrx = ui.position.left - PlotUtils.fonts.tooltipWidth;
      d.scry = ui.position.top;
      d.datax = scope.plotRange.scr2dataX(d.scrx);
      d.datay = scope.plotRange.scr2dataY(d.scry);

      PlotTip.renderTips(scope);
    };

    tipdiv.draggable({ drag, stop: drag });

    tipdiv.css('left', x + PlotUtils.fonts.tooltipWidth).css('top', y);

    if (d.isresp === true) {
      scope.jqsvg.find('#' + d.id).attr('opacity', 1);
    } else {
      scope.jqsvg.find('#' + d.id).attr('font-weight', 'bold');
    }

    if (d.sticking == true) {
      PlotTip.pinCloseIcon(scope, d);
      PlotTip.drawLine(scope, d, tipdiv);
    }
  }

  static addTipDivElement(scope, d, key, data) {
    const tipid = `tip_${d.id}`;
    const tiptext = data[d.idx].createTip(d.ele, d.g, scope.stdmodel);

    const tipdiv = $('<div></div>')
      .appendTo(scope.jqcontainer)
      .css({ 'border-color': data[d.idx].tip_color })
      .attr('id', tipid)
      .attr('class', 'plot-tooltip')
      .append(tiptext)
      .on('mouseup', function (e) {
        if (e.which == 3) {
          PlotTip.clear(scope, d);
          $(this).remove();
        }
      });

    if (!scope.tipmoving) {
      setTimeout(() => tipdiv.css({ opacity: 1, transition: 'opacity 0.4s' }));
    } else {
      tipdiv.css({ opacity: 1, transition: 'opacity 0s' });
      scope.tipmoving = false;
    }

    if (data[d.idx].tip_class) {
      tipdiv.addClass(data[d.idx].tip_class);
    }

    return tipdiv;
  }

  static hideTips(scope, itemid, hidden = true) {
    _.each(scope.tips, (value, key: string) => {
      if (key.search('' + itemid) === 0) {
        scope.tips[key].hidden = hidden;
      }
    });
  }

  static tooltip(scope, d, mousePos) {
    Object.keys(scope.tips).forEach(function (id) {
      !scope.tips[id].sticking && PlotTip.clear(scope, scope.tips[id]);
    });

    if (!d || scope.tips[d.id] != null) {
      return;
    }

    if (d.isresp === true) {
      scope.jqsvg.find('#' + d.id).css('opacity', 1);
    }

    scope.tips[d.id] = {};
    d = PlotTip.extendTipsData(scope, d, mousePos);

    PlotTip.renderTips(scope);
  }

  static untooltip(scope, d) {
    if (!d || scope.tips[d.id] == null || scope.tips[d.id].sticking === true) {
      return;
    }

    PlotTip.hideTips(scope, d.id);
    PlotTip.clear(scope, d, true);
  }

  static toggleTooltip(scope, d) {
    if (!d || scope.zoomed === true) {
      return;
    } // prevent dragging and toggling at the same time

    const id = d.id;

    if (!scope.tips[id]) {
      PlotTip.tooltip(scope, d, d3.mouse(scope.svg[0][0]));
    } else {
      scope.tips[id].sticking = !scope.tips[id].sticking;

      if (scope.tips[id].sticking === false) {
        PlotTip.hideTips(scope, d.id);
        PlotTip.untooltip(scope, d);
      }
    }

    PlotTip.renderTips(scope);
  }

  static movetooltip(scope, d, mousePos) {
    if (scope.tips[d.id] && scope.tips[d.id].sticking === true) {
      return;
    }

    const x = mousePos[0] + 5;
    const y = mousePos[1] + 5;

    d = PlotTip.extendTipsData(scope, d, mousePos);

    scope.jqcontainer
      .find('#tip_' + d.id)
      .css('left', x + PlotUtils.fonts.tooltipWidth)
      .css('top', y);
  }

  static appendTooltipsToSvg(scope, svg) {
    const tooltipElements = scope.jqcontainer.find('.plot-tooltip').toArray();
    const scopeTipsSize = Object.keys(scope.tips).length;

    if (scopeTipsSize <= 0 || tooltipElements.length <= 0) {
      return;
    }

    tooltipElements.forEach((tooltip) => {
      tooltip = $(tooltip);
      const tooltipCopy = tooltip.clone();

      tooltipCopy.css({
        position: 'inherit',
        top: 'auto',
        left: 'auto',
        bottom: 'auto',
        right: 'auto',
      });

      const getPositive = (value) => (value > 0 ? value : 0);
      const position = PlotStyleUtils.getActualCss(tooltip, 'position') as JQuery.Coordinates;
      const x = getPositive(position.left);
      const y = getPositive(position.top);

      svg
        .append('foreignObject')
        .attr('width', (PlotStyleUtils.getActualCss(tooltip, 'outerWidth', true) as number) + 1) //add 1 because jQuery round size
        .attr('height', (PlotStyleUtils.getActualCss(tooltip, 'outerHeight', true) as number) + 1)
        .attr('x', x)
        .attr('y', y)
        .append('xhtml:body')
        .attr('style', 'position: relative;')
        .attr('xmlns', 'http://www.w3.org/1999/xhtml')
        .html(tooltipCopy[0].outerHTML);
    });
  }

  private static getTipElement(scope, d) {
    if (!d || !d.id) {
      return;
    }

    return scope.jqcontainer.find(`#tip_${d.id}`);
  }

  /**
   * This code checks that tip is in the grid area
   * @param x - x coordinate of the tip
   * @param y - y coordinate of the tip
   * @param w - width of the tip
   * @param h - height of the tip
   * @returns {boolean} true if the tip is outside grid area, otherwise - false
   */
  private static outsideGrid(scope, x, y, w, h) {
    const xPadding = 10;
    const bBox = scope.jqgridg.get(0).getBBox();
    const W = bBox.width;
    const H = bBox.height;
    const X = bBox.x;
    const Y = bBox.y;

    return x > W + X - xPadding || x + w - X + xPadding < 0 || y > H + Y || y + h - Y < 0;
  }

  private static clear(scope, d, hide?) {
    if (!hide) {
      delete scope.tips[d.id];
    }

    const tip = scope.jqcontainer.find(`#tip_${d.id}`);

    if (!hide) {
      tip.remove();
    } else {
      tip.css({ opacity: 0, transition: 'opacity 0.4s' });
      setTimeout(() => tip.remove(), PlotTip.TOOLTIP_ANIMATION_TIME);
    }

    if (d.isresp === true) {
      scope.jqsvg.find(`#${d.id}`).css('opacity', 0);
    } else {
      scope.jqsvg.find(`#${d.id}`).removeAttr('font-weight');
    }
  }

  private static pinCloseIcon(scope, d) {
    const tip = PlotTip.getTipElement(scope, d);

    if (tip.has('i').length > 0) {
      return;
    }

    const closeIcon = $('<i/>', { class: 'fa fa-times' }).on('click', function () {
      PlotTip.clear(scope, d);
      $(this).parent('.plot-tooltip').remove();
      scope.maing.selectAll('#' + d.id + '_line').remove();
    });

    tip.prepend(closeIcon);
  }

  private static addAttachment(x, y, x2, y2, attachments) {
    attachments.push({
      x: x,
      y: y,
      dist: Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2)),
    });
  }

  private static drawLine(scope, d, tipdiv) {
    const data = scope.stdmodel.data;
    const svg = scope.maing;
    const attachments: _.Dictionary<any> = [];

    const x2 = scope.plotRange.data2scrX(d.targetx);
    const y2 = scope.plotRange.data2scrY(d.targety);
    const position = tipdiv.position();

    const left = position.left;
    const top = position.top;
    const height = tipdiv.outerHeight();
    const width = tipdiv.outerWidth();

    PlotTip.addAttachment(left, top + height / 2, x2, y2, attachments);
    PlotTip.addAttachment(left + width, top + height / 2, x2, y2, attachments);
    PlotTip.addAttachment(left + width / 2, top, x2, y2, attachments);
    PlotTip.addAttachment(left + width / 2, top + height, x2, y2, attachments);
    PlotTip.addAttachment(left, top, x2, y2, attachments);
    PlotTip.addAttachment(left + width, top, x2, y2, attachments);
    PlotTip.addAttachment(left + width, top + height, x2, y2, attachments);
    PlotTip.addAttachment(left, top + height, x2, y2, attachments);

    const attachment = _.min(attachments, (item) => item.dist);
    const x1 = attachment.x;
    const y1 = attachment.y;

    svg
      .append('line')
      .style('stroke', data[d.idx].tip_color)
      .attr('class', 'plot-tooltip-line')
      .attr('id', d.id + '_line')
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('x1', x1)
      .attr('y1', y1);
  }

  private static extendTipsData(scope, d, mousePos) {
    if (!scope.tips[d.id]) {
      return d;
    }

    _.extend(scope.tips[d.id], d);

    const tipData = scope.tips[d.id];
    tipData.sticking = false;

    tipData.targetx = d.tooltip_cx ? scope.plotRange.scr2dataX(d.tooltip_cx) : scope.plotRange.scr2dataX(mousePos[0]);
    tipData.targety = d.tooltip_cy ? scope.plotRange.scr2dataY(d.tooltip_cy) : scope.plotRange.scr2dataY(mousePos[1]);

    tipData.datax = scope.plotRange.scr2dataX(mousePos[0] + 5);
    tipData.datay = scope.plotRange.scr2dataY(mousePos[1] + 5);

    return tipData;
  }
}
