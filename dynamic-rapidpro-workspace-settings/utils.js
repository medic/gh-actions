const core = require('@actions/core');
const path = require('path');
const { render } = require('template-file');
const axios = require('axios').default;
const flowsFile = 'flows.js';
const appSettingsFile = 'app_settings.json';
const baseSettingsFile = 'app_settings/base_settings.json';

const fields = ['hostname',
  'couch_node_name', 
  'couch_username', 
  'couch_password', 
  'rp_hostname', 
  'value_key', 
  'outbound_mapping_exprs', 
  'rp_api_token', 
  'directory'
];

const getReplacedContent = async (content, data) =>{
  try{
    if(!data || !content){
      throw new Error('Data file or content to replace not defined');
    }
    return await render(JSON.stringify(content), data);
  }catch(err){
    throw new Error(err.message);
  }
}; 

const getCouchDbUrl = (hostname, couch_node_name, value_key, couch_username, couch_password) => {
  try{
    const url = new URL(`${hostname}/_node/${couch_node_name}/_config/medic-credentials/${value_key}`);
    url.username = couch_username;
    url.password = couch_password;
    
    return url;
  } catch(err){
    throw new Error(err.message);
  }
};

const getInputs = (core) => {
  const inputs = {};
  fields.forEach((field) => {
    inputs[field] = core.getInput(field);
  });
  return inputs;
};

const isValidObject = data => Object.keys(data).length !== 0 && data.constructor === Object;

const run = async (githubWorkspacePath, params, fs) => {
  try {
    if (!githubWorkspacePath) {
      throw new Error(`GITHUB_WORKSPACE not defined`);
    }
    const secrets = getInputs(params);
    const flattenedSecrets = flattenObject(secrets);
    if (!isValidObject(secrets.outbound_mapping_exprs)) {
      throw new Error(`Invalid outbound mapping expressions data`);
    }
    const codeRepository = path.resolve(path.resolve(githubWorkspacePath), secrets.directory);
    process.chdir(codeRepository);
    const url = getCouchDbUrl(secrets.hostname, secrets.couch_node_name, secrets.value_key, secrets.couch_username, secrets.couch_password);
    const settingsFile = fs.existsSync(baseSettingsFile) ? baseSettingsFile : appSettingsFile;
    const appSettings = fs.readFileSync(`${codeRepository}/${settingsFile}`, 'utf8');
    const settings = await getReplacedContent(JSON.parse(appSettings), flattenedSecrets);
    let flowsContent = null;
    if (fs.existsSync(flowsFile)) {
      const rawFlowsContent = fs.readFileSync(`${codeRepository}/${flowsFile}`, 'utf8');
      flowsContent = await getReplacedContent(rawFlowsContent, flattenedSecrets);
    }

    await axios.put(url.href, `"${secrets.rp_api_token}"`);
    fs.writeFileSync(`${codeRepository}/${settingsFile}`, settings);
    if(flowsContent !== null){
      fs.writeFileSync(`${codeRepository}/${flowsFile}`, flowsContent);
    }
    core.info(`Successful`);
  } catch (error) {
    core.setFailed(error.message);
  }
};

const flattenObject = obj => {
  if(!isValidObject(obj)){
    throw new Error(`Value is not an object`);
  }
  let res = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      res = { ...res, ...flattenObject(value) };
    } else {
      res[key] = value;
    }
  }
  return res;
};

module.exports = {
  fields,
  getReplacedContent,
  getCouchDbUrl,
  getInputs,
  run,
  isValidObject,
  flattenObject
};
