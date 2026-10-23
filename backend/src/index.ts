import "dotenv/config";
import { createApp } from "./app";

const port = process.env.PORT ?? 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`Fashion AR backend listening on http://localhost:${port}`);
});
