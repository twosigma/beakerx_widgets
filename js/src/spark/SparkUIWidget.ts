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

import { Panel } from '@lumino/widgets';
import { SparkUIMessage } from './SparkUIMessage';
import { ProfileSelectorWidget, SessionWidget, StartWidget } from './widgets';
import { SparkUIComm } from './SparkUIComm';
import { IProfileListItem } from './IProfileListItem';

export class SparkUIWidget extends Panel {
  readonly comm: SparkUIComm;
  readonly startWidget: StartWidget;
  readonly profileSelectorWidget: ProfileSelectorWidget;
  readonly sessionWidget: SessionWidget;

  public set profiles(profiles: IProfileListItem[]) {
    this.profileSelectorWidget.profiles = profiles;
  }

  public set currentProfileName(profileName: string) {
    this.profileSelectorWidget.selectProfile(profileName);
  }

  public set isAutoStart(isAutoStart: boolean) {
    if (isAutoStart) {
      this.onAutoStart();
    }
  }

  private onAutoStart() {
    this.startWidget.disableButton();
    this.startWidget.showSpinner();
    this.comm.autoStarted.connect(this._onStart, this);
    this.comm.errored.connect(this._onError, this);
  }

  public set userSparkConf(conf: {
    name: string;
    properties: { name: string; value: string }[];
    'spark.executor.cores': string;
    'spark.executor.memory': string;
    'spark.master': string;
    'spark.app.name': string;
  }) {
    this.profileSelectorWidget.userSparkConf = conf;
  }

  constructor(comm: SparkUIComm) {
    super();

    this.comm = comm;

    this.addClass('bx-spark2-widget');

    this.startWidget = new StartWidget();
    this.profileSelectorWidget = new ProfileSelectorWidget(this.comm);
    this.sessionWidget = new SessionWidget();

    this.addWidget(this.startWidget);
    this.addWidget(this.profileSelectorWidget);
    this.addWidget(this.sessionWidget);

    this.sessionWidget.hide();

    this.onGlobalStop();
  }

  public processMessage(msg: SparkUIMessage): void {
    switch (msg.type) {
      case 'start-clicked':
        this.onStart();
        break;
      case 'stop-clicked':
        this.onStop();
        break;
      default:
        super.processMessage(msg);
        break;
    }
  }

  private onStart(): void {
    const configuration = this.profileSelectorWidget.getConfiguration();
    const properties: { name: string; value: string }[] = [];
    for (const propertyName in configuration.properties) {
      properties.push({
        name: propertyName,
        value: configuration.properties[propertyName],
      });
    }

    this.startWidget.disableButton();
    this.startWidget.showSpinner();

    this.comm.started.connect(this._onStart, this);
    this.comm.errored.connect(this._onError, this);
    this.comm.sendStartMessage(
      this.profileSelectorWidget.currentProfileName,
      configuration.executorMemory,
      configuration.masterURL,
      configuration.executorCores,
      properties,
    );
  }

  private _onStart(this: SparkUIWidget, sender, msg: { sparkUiWebUrl: string }): void {
    this.comm.started.disconnect(this._onStart, this);
    this.comm.statsChanged.connect(this._onStatsChanged, this);
    this.startWidget.enableButton();
    this.startWidget.hideSpinner();
    this.startWidget.clearError();
    this.startWidget.hide();
    this.profileSelectorWidget.hide();
    this.sessionWidget.sparkUiWebUrl = msg.sparkUiWebUrl;

    this.sessionWidget.show();
    this.sessionWidget.enableStop();
  }

  private _onStatsChanged(sender, data: { activeTasks: number; isActive: boolean; memoryUsed: number }[]): void {
    this.sessionWidget.updateStats(data);
  }

  private onStop(): void {
    this.sessionWidget.disableStop();
    this.sessionWidget.showSpinner();
    this.comm.stopped.connect(this._onStop, this);
    this.comm.sendStopMessage();
  }

  private _onStop() {
    this.comm.stopped.disconnect(this._onStop, this);
    this.comm.statsChanged.disconnect(this._onStatsChanged, this);

    this.startWidget.show();
    this.startWidget.enableButton();
    this.profileSelectorWidget.show();
    this.sessionWidget.hideSpinner();
    this.sessionWidget.hide();
  }

  private _onError(this: SparkUIWidget, sender, msg: string): void {
    this.comm.errored.disconnect(this._onError, this);
    this.startWidget.showError(msg);
    this.startWidget.enableButton();
    this.startWidget.hideSpinner();
  }

  private onGlobalStop() {
    this.comm.globalStopped.connect(this._onStop, this);
  }
}
