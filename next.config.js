const {
  PHASE_PRODUCTION_BUILD,
} = require('next/constants')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Commented off so that backend server APIs
  // are called only once from useEffect.
  // reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
}

module.exports = (phase) => {
  const isProd = phase === PHASE_PRODUCTION_BUILD;

  console.log(`isProd:${isProd}`);

  // Buildtime Configs
  const env = {
    BE_URL: isProd ? "/api" : "http://localhost:5000"
  }

  console.log({env,});
  console.log({...nextConfig, env})
  return {...nextConfig, env};

  // Runtime Configs - doesn't work
  // const publicRuntimeConfig = {
  //   HOST_MSG: process.env.HOST_MSG
  // }

  // console.log({env,});
  // console.log({...nextConfig, env, publicRuntimeConfig})
  // return {...nextConfig, env, publicRuntimeConfig};
}
