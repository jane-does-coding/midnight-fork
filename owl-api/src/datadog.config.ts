import tracer from 'dd-trace';

tracer.init({
  profiling: true,
  service: process.env.DD_SERVICE || 'owl-api',
  env: process.env.DD_ENV || process.env.NODE_ENV || 'production',
  version: process.env.DD_VERSION || 'unknown',
  logInjection: true,
});

export default tracer;
