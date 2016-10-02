'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Task} from '../../commons-node/tasks';
import type {Directory} from '../../nuclide-remote-connection';
import type {TaskMetadata} from '../../nuclide-task-runner/lib/types';

import {Observable} from 'rxjs';
import HhvmIcon from '../../commons-atom/HhvmIcon';
import UniversalDisposable from '../../commons-node/UniversalDisposable';
import {observableFromSubscribeFunction} from '../../commons-node/event';

import ProjectStore from './ProjectStore';

export default class HhvmBuildSystem {
  id: string;
  name: string;
  _projectStore: ProjectStore;
  _extraUi: ?ReactClass<any>;

  constructor() {
    this.id = 'hhvm';
    this.name = 'HHVM';
    this._projectStore = new ProjectStore();
  }

  dispose() {
    this._projectStore.dispose();
  }

  observeTaskList(callback: (taskList: Array<TaskMetadata>) => mixed): IDisposable {
    return new UniversalDisposable(
      Observable.concat(
        Observable.of(this.getTaskList()),
        observableFromSubscribeFunction(this._projectStore.onChange.bind(this._projectStore))
          .map(() => this.getTaskList()),
      )
        .subscribe(callback),
    );
  }

  getTaskList(): Array<TaskMetadata> {
    const disabled = this._projectStore.getProjectType() !== 'Hhvm';
    return [
      {
        type: 'debug',
        label: 'Debug',
        description: 'Debug a HHVM project',
        disabled,
        priority: 1,  // Take precedence over the Arcanist build toolbar.
        runnable: !disabled,
        icon: 'plug',
      },
    ];
  }

  getIcon(): ReactClass<any> {
    return HhvmIcon;
  }

  runTask(taskName: string): Task {
    // TODO
    return {
      start() {},
      cancel() {},
      onDidComplete(callback: () => mixed) {
        callback();
        return {
          dispose() {},
        };
      },
      onDidError(callback: (err: Error) => mixed) {
        return {
          dispose() {},
        };
      },
    };
  }

  setProjectRoot(projectRoot: ?Directory): void {
    // TODO: ProjectStore should use the CWD rather than the current file.
  }
}