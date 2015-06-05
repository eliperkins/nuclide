'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var logger = require('nuclide-logging').getLogger();
var ClangService = require('./ClangService');

/**
 * Mock class for LocalClangService implementation.
 * Since nuclide-clang is not ready to be open sourced, we put the implementation into `fb`
 * subfolder as it won't be published, and the open sourced version will load this
 * mock class as ClangService's local implementation to make sure nothing breaks.
 */
class LocalClangServiceMock extends ClangService {
  async compile(src: NuclideUri, contents: string): Promise<mixed> {
    return {
      diagnostics: [],
    };
  }

  getCompletions(src: NuclideUri, contents: string, line: number, column: number,
      tokenStartColumn: number, prefix: string): Promise<mixed> {
    return {
      file: src,
      completions: [],
      line,
      column,
      prefix,
    };
  }

  async getDeclaration(src: NuclideUri, contents: string, line: number, column: number
      ): Promise<?{file: NuclideUri; line: number; column: number}> {
    return null;
  }

  getIdForPosition(src: NuclideUri, contents: string, line: number, column: number): Promise {
    return {src, line, column};
  }
}

try {
  var LocalClangService = require('./fb/LocalClangService');
} catch (e) {
  logger.info('Use LocalClangServiceMock.');
  var LocalClangService = LocalClangServiceMock;
}

module.exports = LocalClangService;
