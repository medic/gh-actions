const core = require('@actions/core');
const fs = require('fs');
const { run } = require('./utils');

(async () => {
  const githubWorkspacePath = process.env['GITHUB_WORKSPACE'];
  run(githubWorkspacePath, core, fs);
})();
