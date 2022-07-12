
const { Factory } = require('rosie');
const { faker } = require('@faker-js/faker');
Factory.define('secrets').attrs({
  hostname: faker.internet.url(),
  couch_node_name: 'couchdb@127.0.0.1',
  couch_username: faker.internet.userName(),
  couch_password: faker.internet.password(),
  rp_hostname: faker.internet.url(),
  rp_api_token: faker.datatype.uuid(),
  value_key: 'rapidpro.dev',
  outbound_mapping_exprs: {
    sample_group_1: faker.datatype.uuid(),
    sample_group_2: faker.datatype.uuid(),
    sample_helper_flow_1: faker.datatype.uuid(),
    sample_helper_flow_2: faker.datatype.uuid(),
    sample_urn_1: faker.phone.phoneNumber('+254#########'),
    sample_urn_2: faker.phone.phoneNumber('+1##########'),
    sample_flow_1_uuid: faker.datatype.uuid(),
    sample_flow_2_uuid: faker.datatype.uuid()
  },
  directory: 'test'
});

const secrets = Factory.build(`secrets`);
secrets.getInput = key => secrets[key];

module.exports = secrets;
