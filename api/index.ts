import app from './app';

const APP_PORT = 3005;

export const main = async () => {
  try {
    await app.ready();
    app.listen({ port: APP_PORT, host: '0.0.0.0' }, (error, address) => {
      if (error) {
        throw new Error(error.message);
      }
      console.info("INIT", `Server listening at ${address}`);
    });
  } catch (e) {
    console.log("fofoff", e)
  }
}

main();