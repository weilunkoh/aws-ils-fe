
# aws-ils-fe Code Repository
This is a frontend [Next.js](https://nextjs.org/) web application for a system that enables Interactive Learning with Safeguards (ILS).

Paper Publication: https://doi.org/10.1016/j.mlwa.2024.100583

## Pre-requisites
- Install Node Package Manager (NPM): https://www.npmjs.com/package/npm
- Install Yarn: https://classic.yarnpkg.com/lang/en/docs/install/ 

## Running the Codes Locally

To run the development server, run either of the following commands:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running the Codes via Docker

If you have [Docker](https://docs.docker.com/get-docker/) available in your system, the Next.js application can also be run as a Docker container. For convenience, scripts are provided to facilitate loading the Docker images and running the Docker containers. You can navigate to the `/deployment` folder and execute the commands below.

- For building Docker images from the code base
```bash
./dockerise.bat
```
- For running Docker containers
```bash
./run-fe.bat
```

To stop the Docker container, navigate to the `/deployment` folder and execute the command below:
```bash
./stop-fe.bat
```