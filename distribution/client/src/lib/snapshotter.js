/*
* Used for snapshotting and rollbacks during upgrades.
* See:
*  https://github.com/jenkinsci/jep/tree/master/jep/302
*/

const { spawnSync } = require('child_process');
const logger        = require('winston');
const fs            = require('fs');

const LOG_PREFIX = '[snapshotting]';
// https://github.com/jenkinsci/jep/tree/master/jep/302#user-content-files-to-store
const GITIGNORE_CONTENT = `
/plugins/
/updates/
/secrets/master.key
`;

class Snapshotter {

  constructor(app, options) {
    this.options = options || {};
  }

  init(workingDirectory) {
    if (!workingDirectory) {
      throw new Error('workingDirectory parameter is required');
    }
    this.workingDirectory = workingDirectory;

    if (!fs.existsSync(this.getDotGitDirectory())) {
      this.git('init');
      this.git('config', 'user.email', 'evergreen-client@jenkins.io');
      this.git('config', 'user.name', '"Evergreen Client Snapshotting System (JEP 302)"');
      this.git('commit','--allow-empty', '--message', 'Initial evergreen commit');

      fs.writeFile(`${this.getDotGitDirectory()}/description`,
        `This repository is used and specifically designed for Evergreen snapshotting system
    (https://github.com/jenkinsci/jep/tree/master/jep/302).
    It is *not* intended to act as a backup system in any way.
    Never push this repository outside of the Evergreen container to avoid any risk of
    leaking sensitive data.`,
        (err) => {
          if (err) {
            logger.error('Impossible to write the repository description. Abnormal but not blocking.', err);
          }
        });
    } else {
      logger.info(`${LOG_PREFIX} ${this.getDotGitDirectory()} already initialized, moving on`);
    }
    this.updateGitIgnore();
  }

  /**
   * https://github.com/jenkinsci/jep/tree/master/jep/302#take-a-snapshot
   */
  // TODO: design what needs to be passed (UL from/to, etc.)
  snapshot(message) {
    if (!this.workingDirectory) {
      throw new Error('init() must be called first');
    }

    this.updateGitIgnore();

    this.git('add', '--all');
    // TODO: allow-empty but should trigger a warning if nothing was changed
    this.git('commit', '--allow-empty', '--message', `${message}`);
  }

  /**
   * Will update the .gitignore file and commit if needed.
   * No-Op if already containing the expected content.
   */
  updateGitIgnore() {
    const gitignorePath = `${this.workingDirectory}/.gitignore`;

    if (!fs.existsSync(gitignorePath) ||
        fs.readFileSync(gitignorePath, 'utf-8') !== GITIGNORE_CONTENT ) {
      logger.info(`${LOG_PREFIX} .gitignore outdated or absent, updating.`);
      fs.writeFileSync(gitignorePath, GITIGNORE_CONTENT);
      this.git('add', '.gitignore');
      this.git('commit', '--message', 'Update.gitignore content to latest');
    } else {
      logger.info(`${LOG_PREFIX} .gitignore up to date already.`);
    }
  }

  getDotGitDirectory() {
    return `${this.workingDirectory}/.git`;
  }

  /**
   * Calls git with the passed arguments.
   * Synchronous function, hence will return once the command completes.
   Will throw an Error if the command failed or timed out.
   */
  git(...args) {
    const options = {
      cwd: this.workingDirectory,
      encoding: 'utf-8',
      timeout: 30 * 1000 // could this become too small for big setups?
    };

    const cmd = `git ${args.join(' ')}`;
    logger.info(`${LOG_PREFIX} Running '${cmd}' command in ${this.workingDirectory}`);

    const result = spawnSync('git', args, options);
    if (result.stdout && result.stdout.length > 0) {
      logger.info(`${LOG_PREFIX} stdout: '${result.stdout.toString()}'`);
    }
    if (result.stderr && result.stderr.length > 0) {
      logger.error(`${LOG_PREFIX} stderr: '${result.stderr.toString()}'`);
    }
    if (result.status && result.status !== 0) {
      const errorMessage = `${LOG_PREFIX} Error exit code '${result.status}' while executing command '${cmd}'`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    if (result.error) {
      const errorMessage = `${LOG_PREFIX} Error while executing command '${cmd}': ${result.error}`;
      logger.error(errorMessage);
      throw result.error;
    }
  }
}

module.exports = Snapshotter;
