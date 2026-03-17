process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.ENV_FILE = process.env.ENV_FILE || '.env.e2e';

void import('./main.js');
