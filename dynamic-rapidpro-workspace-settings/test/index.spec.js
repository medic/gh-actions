const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');
const utils = require('../utils');
const secrets = require('./env');
const settings = require('./app_settings.json');
const fs = require('fs');
const axios = require('axios').default;

const sandbox = sinon.createSandbox();

describe(`rapidpro action test suite`, () => {  
  beforeEach(() => {
    sandbox.stub(process, 'env').value({ 'GITHUB_WORKSPACE': path.join(__dirname, '../') });
    sandbox.stub(fs, 'writeFileSync').returns({});
  });

  afterEach(() => {
    sandbox.restore();
  });

  it(`should get a formatted url to set medic-credentials`, async () => {
    const url = utils.getCouchDbUrl(secrets.hostname, secrets.couch_node_name, secrets.value_key, secrets.couch_username, secrets.couch_password);
    expect(url.origin).to.be.equal(secrets.hostname);
    expect(url.username).to.be.equal(secrets.couch_username);
    expect(url.password).to.be.equal(secrets.couch_password);
  });

  it(`should fail if an invalid url is given`, async () => {
    expect( function () {
      utils.getCouchDbUrl('some_invalid_url', secrets.couch_node_name, secrets.value_key, secrets.couch_username, secrets.couch_password);
    }).to.throw( Error );
  });

  it(`should return an object containing required secrets`, async () => {
    const inputs = utils.getInputs(secrets);
    utils.fields.forEach(field => {
      expect(inputs[field]).to.equal(secrets[field]);
    });
  });

  it(`should fail if no argument is passed to get required secrets`, async () => {
    expect( function () {
      utils.getInputs();
    }).to.throw( Error );

    expect( function () {
      utils.getInputs(null);
    }).to.throw( Error );

    expect( function () {
      utils.getInputs({});
    }).to.throw( Error );

    expect( function () {
      utils.getInputs(undefined);
    }).to.throw( Error );
  });

  it(`should update content using the given data`, async () => {
    const appSettings = await utils.getReplacedContent(settings, secrets);
    const parsedSettings = JSON.parse(appSettings);
    expect(search(parsedSettings, 'base_url')).to.equal(secrets.rp_hostname);
  });

  it(`should fail to update if content or data is not defined`, async () => {
    try {
      await utils.getReplacedContent(settings);
    } catch (err) {
      expect(err).to.be.an.instanceOf(Error);
    }
  });

  it(`run should complete successfully`, async () => {
    process.exitCode = 0;
    sandbox.stub(axios, 'put').resolves({ message: 'Ok', status: 200 });
    await utils.run(process.env.GITHUB_WORKSPACE, secrets, fs);
    expect(process.exitCode).to.equal(0);
  });

  it(`run should fail if github workspace is not defined`, async () => {
    await utils.run(null, secrets, fs);
    expect(process.exitCode).to.equal(1);
  });

  it(`run should fail if axios fails to put medic-credentials`, async () => {
    sandbox.stub(axios, 'put').rejects({ message: 'Internal server error', status: 500 });
    await utils.run(process.env.GITHUB_WORKSPACE, secrets, fs);
    expect(process.exitCode).to.equal(1);
  });

  it(`should be false if invalid flows data is given`, async () => {
    let isValid = utils.isValidFlows({});
    expect(isValid).to.be.false;

    isValid = utils.isValidFlows(0);
    expect(isValid).to.be.false;
  });

  it(`should be true if valid flows data is given`, async () => {
    const isValid = utils.isValidFlows(secrets.rp_flows);
    expect(isValid).to.be.true;
  });
});

/**
 * Finds a value from nested JavaScript object using a key.
 * @param {object} haystack the JavaScript object
 * @param {string}  needle the key to search
 */
const search = (haystack, needle) => {
  if(needle in haystack) {
    return haystack[needle];
  }
  return Object.values(haystack).reduce((acc, val) => {
    if (acc !== undefined) {
      return acc;
    }
    if (typeof val === 'object') {
      return search(val, needle);
    }
  }, undefined);
};
