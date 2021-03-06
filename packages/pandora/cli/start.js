'use strict';
const path = require('path');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {calcAppName, attachEntryParams} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));
const cliUtils = require('./util/cliUtils');
const {consoleLogger} = cliUtils;

exports.command = 'start [targetPath]';
exports.desc = 'Start an application';
exports.builder = (yargs) => {

  yargs.option('name', {
    alias: 'n',
    describe: 'App name, it will get a name from [targetPath] by default'
  });

  yargs.option('env', {
    alias: 'E',
    describe: 'Environment Variables, such as --env="A=1 B=2"'
  });

  yargs.option('argv', {
    alias: 'A',
    describe: 'Node.js argv, such as --argv="--expose-gc --max_old_space_size=500"'
  });

  yargs.option('npm', {
    describe: 'Find the Application by require.resolve()',
    boolean: true
  });

};
/**
 * start an app
 * @param argv
 */
exports.handler = function (argv) {

  if(argv.npm) {
    if(!argv.targetPath) {
      consoleLogger.error('[targetPath] is required when --npm flag enabled');
      process.exit(1);
      return;
    }
    if(!argv.name) {
      consoleLogger.error('option --name is required when --npm flag enabled');
      process.exit(1);
      return;
    }
    const resolveTarget = cliUtils.dirnameUntilPkgJson(require.resolve(argv.targetPath));
    if(!resolveTarget) {
      consoleLogger.error('Can\'t found ' + argv.targetPath + ' from ' + __dirname);
    }
    consoleLogger.important('Resolve ' + argv.targetPath + ' to ' + resolveTarget);
    argv.targetPath = resolveTarget;
  }

  argv.entry = argv.targetPath;

  let sendParams;
  try {
    sendParams = attachEntryParams('start', argv, {
      appName: calcAppName(argv.targetPath || process.cwd())
    });
  } catch(err) {
    consoleLogger.error(err);
    process.exit(1);
  }

  const send = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler')).send;
  consoleLogger.info('Starting ' + sendParams.appName + ' at ' + sendParams.appDir);

  send('start', sendParams, (err, data) => {
    if (err) {
      consoleLogger.error(err);
      process.exit(1);
      return;
    }
    consoleLogger.info(data);
    process.exit(0);
  });

};
