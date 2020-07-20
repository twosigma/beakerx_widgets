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
import moment from 'moment-timezone';
import { DefaultAxis } from './DefaultAxis';
import { Big } from 'big.js';
import { BigNumberUtils, CommonUtils } from '../../../../utils';

const NANOTIME_TYPE = 'nanotime';

export class TimeAxis extends DefaultAxis {
  UNIT: number;
  SECOND: number;
  MINUTE: number;
  HOUR: number;
  DAY: number;
  MONTH: number;
  YEAR: number;

  constructor(type: 'time' | 'nanotime') {
    super(type);

    this.setUnits();
  }

  setUnits(): void {
    if (this.axisType === NANOTIME_TYPE) {
      this.UNIT = 1000000;
    } else {
      this.UNIT = 1;
    }

    this.SECOND = 1000 * this.UNIT;
    this.MINUTE = 1000 * 60 * this.UNIT;
    this.HOUR = 1000 * 60 * 60 * this.UNIT;
    this.DAY = 1000 * 60 * 60 * 24 * this.UNIT;
    this.MONTH = 1000 * 60 * 60 * 24 * 30 * this.UNIT;
    this.YEAR = 1000 * 60 * 60 * 24 * 365 * this.UNIT;
  }

  addIntervals(i: number, intervals: number[]): void {
    const prev = intervals[intervals.length - 1];

    this.addTimeAxisIntervals(i, intervals, prev);
  }

  setRange(vl, vr, axisTimezone): void {
    if (vl !== null) {
      this.axisValL = vl;
    }
    if (vr !== null) {
      this.axisValR = vr;
    }

    this.setTimeAxisRange(axisTimezone);

    this.axisValSpan = BigNumberUtils.minus(this.axisValR, this.axisValL);
  }

  setTimeAxisRange(axisTimezone): void {
    if (axisTimezone !== null) {
      this.axisTimezone = axisTimezone;
    }

    if (this.axisType === 'time') {
      return;
    }

    // For nanotime
    if (!BigNumberUtils.isBig(this.axisValL)) {
      this.axisValL = new Big(this.axisValL);
    }

    if (!BigNumberUtils.isBig(this.axisValR)) {
      this.axisValR = new Big(this.axisValR);
    }
  }

  setGridlines(pointLeft, pointRight, count, marginLeft, marginRight): void {
    if (pointRight < pointLeft) {
      console.error('cannot set right coord < left coord');

      return;
    }

    this.setAxisPct(pointLeft, pointRight);
    this.axisMarginValL = BigNumberUtils.mult(this.axisValSpan, marginLeft);
    this.axisMarginValR = BigNumberUtils.mult(this.axisValSpan, marginRight);

    const span = this.getSpan();

    this.setAxisSteps(span, this.dateIntws, {}, count);
    this.setLinesAndLabels(pointLeft, pointRight, span);
  }

  addTimeAxisIntervals(i: number, intervals: number[], prev: number): void {
    if (i === 0) {
      intervals.push(1);
      intervals.push(5);

      return;
    }

    if (prev < this.UNIT) {
      intervals.push(prev + 5);
    } else if (prev === this.UNIT) {
      intervals.push(prev + 4 * this.UNIT);
    } else if (prev < this.SECOND) {
      intervals.push(prev + 5 * this.UNIT);
    } else if (prev === this.SECOND) {
      intervals.push(prev + this.SECOND * 4);
    } else if (prev < this.MINUTE) {
      intervals.push(prev + this.SECOND * 5);
    } else if (prev === this.MINUTE) {
      intervals.push(prev + this.MINUTE * 4);
    } else if (prev < this.HOUR) {
      intervals.push(prev + this.MINUTE * 5);
    } else if (prev < this.DAY) {
      intervals.push(prev + this.HOUR);
    } else if (prev < this.MONTH) {
      intervals.push(prev + this.DAY);
    } else if (prev < this.YEAR) {
      intervals.push(prev + this.DAY * 10);
    } else {
      intervals.push(prev + this.YEAR);
    }
  }

  calcLabels(lines, span): { common: string; labels: string[] } {
    let labels = [];

    if (this.axisType === 'category') {
      labels = this.getCategoryAxisLabels(lines);
    } else {
      labels = this.getDefaultAxisLabels(lines, span);
    }

    if (this.shouldCalcTimeAxisLabels(labels, span)) {
      return this.getTimeAxisLabels(lines, span);
    }

    return {
      common: this.calcTimeAxisLabelsCommonPart(labels, span),
      labels: labels,
    };
  }

  shouldCalcTimeAxisLabels(labels: string[], span: number): boolean {
    return (
      ((span > this.SECOND && this.axisType === 'time') ||
        (this.axisType === 'nanotime' && BigNumberUtils.gt(span, this.UNIT))) &&
      labels.length != _.uniq(labels).length
    );
  }

  getTimeAxisLabels(lines: any[], span: number | Big): { common: string; labels: string[] } {
    if (this.axisType === 'nanotime' && BigNumberUtils.lte(span, this.SECOND)) {
      span = this.UNIT;
    } else if (BigNumberUtils.lte(span, this.MINUTE)) {
      span = this.SECOND;
    } else if (BigNumberUtils.lte(span, this.HOUR)) {
      span = this.MINUTE;
    } else if (BigNumberUtils.lte(span, this.DAY)) {
      span = this.HOUR;
    } else if (BigNumberUtils.lte(span, this.MONTH)) {
      span = this.DAY;
    } else if (BigNumberUtils.lte(span, this.YEAR)) {
      span = this.MONTH;
    } else {
      span = this.YEAR;
    }

    if (this.axisType === NANOTIME_TYPE) {
      span = new Big(span).minus(1);
    } else {
      span -= 1;
    }

    return this.calcLabels(lines, span);
  }

  calcTimeAxisLabelsCommonPart(labels, span) {
    let common = '';

    if (
      (this.axisType !== 'time' && this.axisType !== 'nanotime') ||
      !BigNumberUtils.gte(span, this.HOUR) ||
      labels.length <= 1
    ) {
      return common;
    }

    const tokens = labels[0].split(' ');
    let index = 0;

    const checkCommon: (number) => boolean = (index) => {
      const substring = common ? `${common} ${tokens[index]}` : tokens[index];

      for (let i = 1; i < labels.length; i++) {
        if (substring !== labels[i].substring(0, substring.length)) {
          return false;
        }
      }

      return true;
    };

    while (checkCommon(index)) {
      common = common != '' ? common + ' ' + tokens[index] : tokens[index];
      index = index + 1;
    }

    if (common.length > 1) {
      for (let i = 1; i < labels.length; i++) {
        const label = labels[i];

        if (common != label.substring(0, common.length)) {
          common = '';

          break;
        }
      }
    }

    if (common.length > 1) {
      for (let i = 0; i < labels.length; i++) {
        labels[i] = labels[i].replace(common, '').trim();
      }
    }

    return common.replace(',', '').trim();
  }

  getDefaultAxisLines(pointLeft, pointRight, axisStep): number[] {
    const lines: number[] = [];
    const valueRight = this.getValue(pointRight);
    let value = this.getValue(pointLeft);

    if (BigNumberUtils.isBig(value)) {
      value = value as BigJs.Big;
      value = value.gte(0)
        ? value.div(axisStep).round(0, 3).times(axisStep)
        : value.div(axisStep).round(0, 0).times(axisStep);
    } else {
      value = this.normalizeValue(Math.ceil((value as number) / axisStep) * axisStep, axisStep);
    }
    while (BigNumberUtils.lte(value, valueRight) || BigNumberUtils.lte(value, BigNumberUtils.plus(valueRight, 1e-12))) {
      const pointCoords = this.getPercent(value);

      lines.push(pointCoords);
      value = this.normalizeValue(BigNumberUtils.plus(value, axisStep), axisStep);
    }

    return lines;
  }

  normalizeValue(value, axisStep) {
    if (this.axisType !== 'time' || !BigNumberUtils.gt(axisStep, this.DAY)) {
      return value;
    }

    if (BigNumberUtils.lte(axisStep, this.MONTH)) {
      value = this.selectStartOrEndInterval(value, 'day');
    } else if (BigNumberUtils.lte(axisStep, this.YEAR)) {
      value = this.selectStartOrEndInterval(value, 'month');
    } else {
      value = this.selectStartOrEndInterval(value, 'year');
    }

    return value;
  }

  selectStartOrEndInterval(value: number, interval: moment.unitOfTime.StartOf) {
    const nextIntervalStart = CommonUtils.applyTimezone(value, this.axisTimezone).endOf(interval).add(1, 'ms');
    const intervalStart = CommonUtils.applyTimezone(value, this.axisTimezone).startOf(interval);

    return nextIntervalStart.valueOf() - value > value - intervalStart.valueOf() ? intervalStart : nextIntervalStart;
  }

  getString(pointCoords: number, span: number): string {
    return this.getTimeAxisStringValue(pointCoords, span);
  }

  getTimeAxisStringValue(pointCoords: number, span: number): string {
    const value = this.getValue(pointCoords);
    let timestamp: number;
    let nanosec: number;

    if (this.axisType === 'time') {
      timestamp = Math.ceil((value as number) * 1000) / 1000;
    } else if (this.axisType === 'nanotime') {
      const v: Big = new Big(value);
      timestamp = parseFloat(v.div(1000000).toFixed(0));
      nanosec = parseFloat(v.mod(1000000000).toFixed(0));
    }

    if (BigNumberUtils.lte(span, this.SECOND) && this.axisType === 'time') {
      return (
        CommonUtils.formatTimestamp(timestamp, this.axisTimezone, '.SSS') +
        (timestamp - Math.floor(timestamp)).toFixed(this.axisFixed)
      );
    }

    if (BigNumberUtils.lte(span, this.MINUTE) && this.axisType === 'time') {
      return CommonUtils.formatTimestamp(timestamp, this.axisTimezone, 'mm:ss.SSS');
    }

    if (BigNumberUtils.lte(span, this.HOUR)) {
      if (this.axisType !== 'nanotime') {
        return CommonUtils.formatTimestamp(timestamp, this.axisTimezone, 'HH:mm:ss');
      }

      if (moment(timestamp).valueOf() < this.SECOND) {
        return '.' + CommonUtils.padStr(nanosec, 9);
      }

      return (
        CommonUtils.formatTimestamp(timestamp, this.axisTimezone, 'HH:mm:ss') + '.' + CommonUtils.padStr(nanosec, 9)
      );
    }

    if (BigNumberUtils.lte(span, this.DAY)) {
      return CommonUtils.formatTimestamp(timestamp, this.axisTimezone, 'YYYY MMM DD, HH:mm');
    }

    if (BigNumberUtils.lte(span, this.MONTH)) {
      return CommonUtils.formatTimestamp(timestamp, this.axisTimezone, 'YYYY MMM DD');
    }

    if (BigNumberUtils.lte(span, this.YEAR)) {
      return CommonUtils.formatTimestamp(timestamp, this.axisTimezone, 'YYYY MMM');
    }

    return CommonUtils.formatTimestamp(timestamp, this.axisTimezone, 'YYYY');
  }
}
