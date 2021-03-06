/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import type {BusySignalProvider} from '../../nuclide-busy-signal/lib/types';
import type {BusySignalProviderBase} from '../../nuclide-busy-signal';
import type {TaskRunnerServiceApi} from '../../nuclide-task-runner/lib/types';
import type {CwdApi} from '../../nuclide-current-working-directory/lib/CwdApi';
import type {OutputService} from '../../nuclide-console/lib/types';
import type {DeepLinkService} from '../../nuclide-deep-link/lib/types';
import type {RemoteProjectsService} from '../../nuclide-remote-projects';

import {CompositeDisposable, Disposable} from 'atom';
import createPackage from '../../commons-atom/createPackage';
import registerGrammar from '../../commons-atom/register-grammar';
// eslint-disable-next-line nuclide-internal/no-cross-atom-imports
import {DedupedBusySignalProviderBase} from '../../nuclide-busy-signal';
import {ArcanistDiagnosticsProvider} from './ArcanistDiagnosticsProvider';
import ArcBuildSystem from './ArcBuildSystem';
import {openArcDeepLink} from './openArcDeepLink';

class Activation {
  _disposables: CompositeDisposable;
  _busySignalProvider: BusySignalProviderBase;
  _buildSystem: ?ArcBuildSystem;
  _cwdApi: ?CwdApi;
  _remoteProjectsService: ?RemoteProjectsService;

  constructor(state: ?Object) {
    this._disposables = new CompositeDisposable();
    this._busySignalProvider = new DedupedBusySignalProviderBase();
    registerGrammar('source.json', ['.arcconfig']);
  }

  dispose(): void {
    this._disposables.dispose();
  }

  setCwdApi(cwdApi: ?CwdApi) {
    this._cwdApi = cwdApi;
    if (this._buildSystem != null) {
      this._buildSystem.setCwdApi(cwdApi);
    }
  }

  provideBusySignal(): BusySignalProvider {
    return this._busySignalProvider;
  }

  provideDiagnostics() {
    const provider = new ArcanistDiagnosticsProvider(this._busySignalProvider);
    this._disposables.add(provider);
    return provider;
  }

  consumeTaskRunnerServiceApi(api: TaskRunnerServiceApi): void {
    this._disposables.add(api.register(this._getBuildSystem()));
  }

  consumeOutputService(api: OutputService): void {
    this._disposables.add(
      api.registerOutputProvider({
        id: 'Arc Build',
        messages: this._getBuildSystem().getOutputMessages(),
      }),
    );
  }

  consumeCwdApi(api: CwdApi): IDisposable {
    this.setCwdApi(api);

    let pkg = this;
    this._disposables.add({
      dispose() { pkg = null; },
    });
    return new Disposable(() => {
      if (pkg != null) {
        pkg.setCwdApi(null);
      }
    });
  }

  /**
   * Files can be opened relative to Arcanist directories via
   *   atom://nuclide/open-arc?project=<project_id>&path=<relative_path>
   * `line` and `column` can also be optionally provided as 1-based integers.
   */
  consumeDeepLinkService(deepLink: DeepLinkService): void {
    this._disposables.add(
      deepLink.subscribeToPath('open-arc', params => {
        openArcDeepLink(params, this._remoteProjectsService);
      }),
    );
  }

  consumeRemoteProjectsService(service: RemoteProjectsService): IDisposable {
    this._remoteProjectsService = service;
    return new Disposable(() => {
      this._remoteProjectsService = null;
    });
  }

  _getBuildSystem(): ArcBuildSystem {
    if (this._buildSystem == null) {
      const buildSystem = new ArcBuildSystem();
      if (this._cwdApi != null) {
        buildSystem.setCwdApi(this._cwdApi);
      }
      this._disposables.add(buildSystem);
      this._buildSystem = buildSystem;
    }
    return this._buildSystem;
  }
}

export default createPackage(Activation);
